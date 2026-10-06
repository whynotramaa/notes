@part II | Pagination | We learn to return long lists in pages that stay fast and correct as the data grows and changes. The obvious approach, page numbers with OFFSET, gets slower with every page and shows duplicates when rows are inserted. We will cover offset pagination and its costs, cursor pagination, and keyset pagination with stable ordering. | where:2

## 5. Offset pagination and its cost

A restaurant manager scrolls through order history, 20 orders per page. The simplest implementation passes a page number, and the server translates it into SQL: page 5,001 becomes `SELECT ... ORDER BY created_at DESC LIMIT 20 OFFSET 100000`. This is **offset pagination**, and it is what most tutorials show. It is easy to build, it supports "jump to page 400", and it can show "page 4 of 250,000" if you also run a count.

It has two problems, one of cost and one of correctness. The cost problem is that the database cannot jump to row 100,000. Even with an index on `created_at`, it walks the index from the beginning, reads 100,000 entries, throws them away and then returns the next 20. That is 100,020 rows read for 20 returned. The work grows linearly with the page number, so page 5,000 costs 5,000 times page 1. At an illustrative microsecond per row, page 5,001 takes about 0.1 s of database time, and a crawler walking every page of 5,000,000 orders performs work that grows with the square of the number of pages.

@fig be_page_offset | 100,000 rows read and discarded to return 20. Deep pages are slow by construction.

The `COUNT(*)` that drives "page 4 of 250,000" has the same problem. Counting 5,000,000 rows that match a filter is a scan in PostgreSQL, so many APIs drop exact totals or show estimates such as "about 5 million".

## 6. Offset pagination under concurrent writes

The correctness problem appears whenever rows are inserted or deleted between page requests, which in an order system is all the time. The manager loads page 1, orders o50 to o48, newest first. A new order, o51, arrives. The manager loads page 2 with offset 3. The list has shifted down by one, so offset 3 now points at o48, which appears again at the top of page 2. A deletion does the opposite and silently skips a row. For a human scrolling, a duplicate is a small annoyance. For a sync job copying orders to an accounting system, a skipped row is a missing invoice that nobody notices for a month.

@fig be_page_offset_shift | One insert between page loads, and o48 appears twice. A delete would make a row vanish.

Offset still has its place. For small, slowly changing collections, such as a restaurant's 40 menu items, or for admin screens where jumping to a page number matters more than perfect consistency, it is fine. For large, constantly changing collections and especially for machine consumers, it is the wrong tool.

## 7. Cursor pagination

**Cursor pagination** replaces the page number with a bookmark. Each response includes the items and a `next_cursor`, an opaque string that encodes where the page ended. The client sends it back as `?cursor=...` to get the next page. Wren's cursor is the base64url encoding of `{"created_at":"2026-10-06T10:00:00Z","id":812345}`, the sort values of the last row returned. The server decodes it and asks for rows after that position, which is the keyset query in Section 8.

@fig be_page_cursor | The cursor encodes the last row's sort key. Clients treat it as opaque and pass it back.

Opacity matters. If clients parse the cursor, Wren can never change its internals, for example adding a field or switching to a different sort key. So the documentation says "treat it as an opaque string", and some APIs sign or encrypt cursors with an HMAC to make tampering detectable. A cursor should also carry the filters and sort it was created with, or be rejected if the client changes them mid-stream, since a cursor from one sort order makes no sense in another.

Cursors give up two things. A client cannot jump to page 400, only move forward (and backward, if the API also returns a `prev_cursor`). And there is no cheap total count. Infinite scroll in feeds and timelines needs neither, which is why Twitter, Facebook, Slack, Stripe and GitHub's newer APIs all use cursors.

:::story Picture this
Reading a long book. Offset pagination is telling a friend "start reading at the 400th line". If someone inserts a paragraph near the front, line 400 is now a different line. Cursor pagination is putting a bookmark after the sentence you finished, which stays in the right place however many pages are added before it.
:::

## 8. Keyset pagination, stable ordering and concurrent writes

The query behind the cursor is **keyset pagination**, also called the seek method. Instead of skipping rows, it filters on the sort key of the last row seen: `WHERE (created_at, id) < ('2026-10-06 10:00:00', 812345) ORDER BY created_at DESC, id DESC LIMIT 20`. With an index on `(created_at, id)`, the database seeks straight to that position in the index and reads 20 rows. Page 5,001 costs the same as page 1. The comparison `(a, b) < (x, y)` is a row-value comparison, supported directly by PostgreSQL and MySQL 8, and it means "a is less than x, or a equals x and b is less than y".

@fig be_page_keyset | Seek to the bookmark, read 20 rows. The cost does not depend on the page number.

The sort order must be **stable**, meaning every row has a unique position. Ordering by `created_at` alone is not stable, because several orders can share a timestamp, especially at Wren's 50 orders per second with second-precision timestamps. If the page boundary falls in the middle of three orders created at 10:00:00, "after 10:00:00" skips the rest of them and "at or after" repeats some. Adding a unique **tiebreaker**, the id, to both the ORDER BY and the cursor gives every row a distinct position, and the index must cover both columns in the same order.

@fig be_page_tiebreak | Three rows share a timestamp. The id breaks the tie, so the boundary is exact.

Keyset pagination also behaves well under concurrent writes. A new order inserted at the top does not shift any later position, so no row repeats or vanishes on the pages that follow. New rows that arrive behind the cursor are simply not seen in this pass, which is usually acceptable for a scroll. A sync job that must catch everything can page by an `updated_at` and id pair and come back later for rows updated since its last run.

:::warn Watch out
Keyset pagination breaks quietly when the sort column can change. If orders are sorted by `status` and an order moves from `pending` to `paid` while a client is paging, it can be seen twice or never. Paginate on immutable or monotonically increasing columns, such as creation time and id.
:::

:::interview Interview lens
**"Why do large offsets get slow, and what would you use instead?"** OFFSET makes the database read and discard every skipped row, so page n costs work proportional to n, 100,020 rows read for 20 returned at offset 100,000. It also shows duplicates or skips rows when data is inserted or deleted between requests. Keyset pagination filters on the last row's sort key with a unique tiebreaker, such as WHERE (created_at, id) < (?, ?) with an index on both, so every page is an index seek of constant cost and inserts do not shift positions. The API exposes that position as an opaque cursor.
:::

:::key In one breath
Offset pagination reads and discards every skipped row, so LIMIT 20 OFFSET 100000 reads 100,020 rows, and inserts or deletes between pages cause duplicates or gaps. Cursor pagination returns an opaque bookmark encoding the last row's sort key, which clients pass back unchanged. Behind it, keyset pagination seeks with `WHERE (created_at, id) < (?, ?)` on an index covering both columns, so every page costs the same. The order must be stable with a unique tiebreaker, and the sort key should not change while clients page.
:::
