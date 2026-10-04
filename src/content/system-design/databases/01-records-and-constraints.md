@part I | Tables, keys and constraints | We give each stored fact an identity and an enforceable shape. Concurrent callers otherwise create duplicates and broken relationships. We will build the tiny tables used throughout this chapter and then count what an index adds. | where:1

## 1. Tables, rows, and the facts we store

A viewer sees a score and asks who entered its latest change. Saving only the current score cannot answer that question. Heron needs the current match, the sequence of changes, and the users who made them. Begin with the facts you must recover, rather than with the product you plan to install.

A **table** groups records with named columns and declared rules. A **row** is one such record, and a **schema** declares its column types and constraints. A row is a logical object; the engine may pack several rows into a storage **page**, the unit it commonly moves between memory and disk. A SQL result does not promise the physical order of those pages.

Our illustrative event table has four rows. The identifiers are labels, not quantities. The sequence belongs to a match: sequence 1 can occur in both `m7` and `m8` without representing the same event. That distinction will determine the composite index in Part II.

| Event | Match | Sequence | Scorer |
|---|---|---:|---|
| e1 | m7 | 1 | u4 |
| e2 | m7 | 2 | u8 |
| e3 | m7 | 3 | u4 |
| e4 | m8 | 1 | u9 |

The user table maps `u4` to Asha, `u8` to Bo, and `u9` to Chen. There are three distinct scorers because Asha appears in two events. Storing a reference avoids rewriting all of Asha's old events when her current display name changes. A historical display-name snapshot would be a different requirement, with a different schema.

@fig sd_databases_tables | Illustrative four-event and three-user input. The repeated scorer is one identity, not a duplicate user.

:::note Logical order needs an explicit request
The insertion order of these rows is not a result-order contract. Ask for `ORDER BY sequence` within a selected match. A plan change, parallel scan, or maintenance operation must not change what the application considers the correct order.
:::

## 2. Primary keys and the duplicate-insert race

Two application processes both receive a request to create match `m7`. Each first asks whether the match exists and sees absence. Each then inserts. A check in one process does not reserve the result against another process changing the database between the check and the insert.

A **primary key** identifies a row uniquely and cannot be null. A **unique constraint** makes the engine reject conflicting committed identities under its concurrency rules. Heron chooses `event_id` as the event primary key and also requires `(match_id, sequence)` to be unique. Those rules protect different identities: an event identifier and a position in one match's history.

Trace the race carefully. A checks absence, B checks absence, A inserts, and B attempts the same unique key. The database must arbitrate that conflict; B may wait for A's transaction and then receive a conflict. If A aborts, B can become the successful creator. The application translates the final result into its API contract.

An automatically generated key is useful for identity, but it does not prove chronological order. Sequence values can have gaps after rollback, and independent writers can reserve identifiers before they commit. Use a separately defined match sequence when users need an ordered score history.

@fig sd_databases_unique_race | Illustrative concurrent creators. The shared constraint, rather than either preliminary read, decides the winner.

:::interview Interview lens
**"Why not check for duplicates in the application?"** The check and insert can race with another caller. I still check when it improves the user experience, but the database must enforce the invariant at commit. Then I handle the conflict as a normal concurrent outcome rather than assuming the pre-check made it impossible.
:::

## 3. Foreign keys and nullable references

An event claims scorer `u99`, but no such user exists. The page can read the event yet cannot display its author. A **foreign key** requires a non-null reference to match a referenced key under the database's constraint rules. It makes the relationship a shared rule instead of a convention every caller must remember.

For Heron's mandatory scorer relationship, declare `scorer_id NOT NULL` and reference `users(user_id)`. Without `NOT NULL`, a nullable foreign key can legally represent an absent relationship. In composite references, null handling also depends on the declared matching rule. The words "foreign key" alone do not make every field mandatory.

Consider removing Asha. A delete can be rejected while events reference her, can cascade into deleting dependent events, or can apply another declared action. Deleting historical score events because a user closed an account may violate the product requirement. A deactivated user record can preserve identity while removing the ability to sign in.

```sql
CREATE TABLE events (
  event_id text PRIMARY KEY,
  match_id text NOT NULL REFERENCES matches(match_id),
  sequence integer NOT NULL,
  scorer_id text NOT NULL REFERENCES users(user_id),
  UNIQUE (match_id, sequence)
);
```

The referenced key needs an appropriate unique identity. An index on the referencing side can also make parent deletes and related queries cheaper, but it is a separate performance choice. [PostgreSQL's constraints documentation](https://www.postgresql.org/docs/18/ddl-constraints.html) distinguishes these obligations and the nullable-reference exception.

@fig sd_databases_keys | Illustrative mandatory references. Identity, existence, and deletion policy are separate schema decisions.

## 4. Indexes exchange write work for read work

Finding `e3` by reading every event works on our tiny table. It becomes expensive when a viewer asks that question repeatedly across a large history. An **index** is a maintained lookup structure that connects a search key to matching rows. The engine consults the structure rather than testing every base row.

The base table and an index are separate maintained objects in many engines. Our event table has four rows, and an ordinary complete event index has four logical entries. Adding another complete index creates another set of entries. One insert now changes the base record and the two indexes, three logical structures before counting logs and internal page work.

An index must be updated when indexed values change, and its entries must respect concurrent visibility. It consumes storage, cache memory, and recovery work. A lookup may still visit the base page for payload columns or visibility checks. "Indexed" does not mean "no disk access" or "one operation."

The useful question is which expensive read the index removes. A match-and-sequence index supports recent history for a known match. An index on scorer supports a different question. Keeping both can be justified, but every added path needs enough benefit to pay for its write and memory costs.

@fig sd_databases_index_cost | Illustrative insert into a table with two complete indexes. The count describes logical maintained structures, not physical IOPS.

:::warn Watch out
A successful SQL insert is not necessarily a committed transaction. A later constraint failure or rollback can remove its effect. Build API acknowledgement around the transaction's completed contract, not around the first statement that returns without an error.
:::

:::key In one breath
Tables hold typed facts, while keys define identity and relationships. A shared uniqueness constraint closes the race between a check and an insert. A foreign key needs a separate non-null rule when the relationship is mandatory. Indexes maintain extra structures so selected reads can avoid examining every row.
:::
