@part IX | Filesystems | A file name is not the file bytes. Directories resolve names to inode metadata, allocation maps logical offsets to blocks, and caches delay storage work. We will follow descriptors, links, allocation, page cache and journaling before returning to the server trace. | where:9

## 36. Filesystems and path lookup

A path lookup starts with a directory entry that maps a name to an inode number. The lookup reaches filesystem metadata that identifies the object and its data blocks. Directories associate names with object identities, so the same object can have several names.

The distinction lets `unlink` remove a name while open descriptors still refer to the underlying object. The data and inode can be reclaimed only when no directory link and no open reference remains. File types include regular files, directories, sockets, pipes and symbolic links, each with different operations.

@fig os_filesystem | Illustrative lookup path moves from filename through directory entry and inode to data blocks. Orange marks the inode because metadata and data references meet there.

Directory traversal checks each component under the filesystem's lookup and permission rules. The final inode describes a regular file, directory or another supported object; its block references identify the stored data for that object. Renaming changes a directory relationship rather than copying every data byte to a new inode. Keeping names separate from identity is what makes open references meaningful across a rename.

Not every file-like descriptor names an on-disk regular file. A socket has transport state, and a pipe has a kernel buffer rather than ordinary allocated file blocks. The uniform descriptor interface does not erase those differences. For Finch, a log file can involve page cache and storage durability, while an accepted socket involves receive queues and readiness. Start from the object type before assigning an operation's wait or persistence behavior.

## 37. File descriptors

`open` returns a small integer index in the process's descriptor table. Descriptor 0 is standard input, 1 standard output and 2 standard error by convention. A new file or socket can occupy descriptor 3. The descriptor refers to kernel open-file state, which includes access mode and current offset where relevant.

Sockets, pipes, terminals and regular files therefore share a handle shape even though their readiness and storage behavior differ. A forked child inherits descriptor references, and a shell uses that fact to connect pipeline endpoints. A close-on-exec flag prevents accidental inheritance into a replaced program.

@fig os_fd_table | Illustrative descriptor table maps small process-local integers to files, streams and sockets. Orange marks descriptor 3 because server resources extend the standard streams.

The integer is local to a process, so descriptor 3 in another process can name a different resource. Duplicating a descriptor can create another reference to the same open-file description, and inherited references after fork can share its current offset. Closing one reference does not automatically close the object while other references remain. This distinction matters for shell pipes and concurrent file access.

Finch's allowance is $1024-24=1000$ descriptors for modeled connections. The reserve includes the listener, event-notification handle, logs and other declared resources; they are not free simply because their count is small. Accepting another socket at that boundary requires releasing a descriptor or changing the deployment budget. Recycling descriptor integers also means delayed work must not confuse a newly opened resource with a closed connection that once used the same number.

## 38. Inodes, hard links and symbolic links

### Inodes

An **inode** stores file type, permissions, owner, size, timestamps, link count and references to data blocks. It usually does not store the filename. The directory owns the name-to-inode mapping, which is why one inode can have several names.

### Hard links and symbolic links

A hard link is another directory entry for the same inode. Removing the original name does not remove the data while another hard link or open reference remains. A symbolic link is a separate file containing a path, so it can become dangling if the target name disappears or moves.

Hard links normally cannot cross filesystem boundaries because the inode belongs to one filesystem. Symbolic links can point across such boundaries because they store a path. Relative symbolic links resolve relative to the link's directory, which makes moving the containing tree part of the correctness analysis.

@fig os_inode_links | Illustrative cards separate inode identity from directory names and path references. Orange marks the hard link because it shares the underlying inode.

A hard link adds a name to the same object, so modifying bytes through either name modifies that object's content. A symbolic link instead performs another path resolution when followed. If the target name is replaced by a different file, following the unchanged symbolic link can now reach that replacement. The two mechanisms therefore behave differently under rename, replacement and deletion even when ordinary reads initially look identical.

Open references add another lifetime condition. Unlinking the last directory name does not reclaim the bytes while an open-file reference remains. This explains a server whose deleted log continues occupying space until its descriptor closes. Directory hard links are restricted under common filesystem rules because arbitrary links would complicate traversal and cycle handling. Treat path identity, inode identity and open-reference lifetime as separate facts during diagnosis.

## 39. Allocation, cache and journaling

Filesystems allocate blocks with contiguous, linked or indexed strategies. Inode-based allocation uses metadata references to locate file ranges, while free-space structures track available blocks. Contiguous extents help sequential access but can fragment as files grow.

The page cache keeps file data in RAM and marks changed pages dirty. A write returning to an application does not automatically mean the storage device has durable bytes. A filesystem journal records metadata intent and ordering so crash recovery can restore a consistent filesystem state. Database WAL solves a related durability problem at another layer.

@fig os_alloc_cache | Illustrative logical file blocks pass through inode pointers, page cache and dirty writeback. Orange marks cached pages; dirty writeback still needs the stated persistence contract.
@fig os_journal | Illustrative journal records intent before metadata and later checkpoints it. Orange marks the initial intent; persistence and metadata changes follow in order.

### Allocation and page cache

Linked allocation follows each block to the next and makes random lookup expensive. Indexed allocation uses a lookup structure so an offset can identify its block more directly. Contiguous allocation and extents improve sequential placement but need a policy for growth and free-space fragmentation. The physical layout is independent of whether application bytes currently reside in the page cache.

### Journaling and persistence

A buffered write can merely dirty a cached page. A flush must reach the persistence boundary promised by the filesystem and device; issuing writeback alone is not a universal durability acknowledgement. Journaling preserves specified filesystem metadata relationships after interruption. It need not preserve every recent application data byte, and it cannot replace the database's own transaction log. The order and scope of recorded state define what crash recovery can reconstruct.


:::story Picture this
A locker can have several labels leading to the same contents. Removing a label does not empty the locker while another label or an issued access key still refers to it. A note saying where another label is located behaves differently: moving that target can leave the note pointing nowhere. These are hard links, open references and symbolic links.
:::

:::note Writeback and durable state
Do not treat a successful buffered write or the start of a flush as a universal persistence promise. The filesystem and storage contract decide which bytes survive interruption. A metadata journal cannot silently stand in for an application transaction log.
:::

:::interview Interview lens
**"Why does deleting an open log not necessarily free its space?"** The directory name and the open-file reference have different lifetimes. Removing the last name can leave the object accessible through an existing descriptor. Reclamation waits for the remaining references, so the server must close or replace its log descriptor deliberately.
:::

:::warn Watch out
Unlinking the final filename does not necessarily reclaim the file while an open reference remains. Closing the owning descriptor and removing a directory name are separate lifetime operations. Check both when deleted logs still occupy storage.
:::

:::key In one breath
Directories map names to inodes, and inodes map metadata to data blocks. File descriptors are process-local handles for files, sockets and pipes. Links differ by inode sharing, while page cache and journaling define storage and crash boundaries.
:::
