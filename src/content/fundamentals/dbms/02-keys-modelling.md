@part II | Identity and relationships | A booking needs an owner and a seat that actually exists. Incorrect identity rules let duplicates and broken references survive every later optimization. We will distinguish keys, assign constraints and turn an ER model into relational tables. | where:2

## 4. Keys are claims about identity

Ada changes her email after buying a ticket. If every dependent record uses that email as its identity, the change reaches every referencing table. A stable generated customer ID lets the email change while the customer remains the same.

A **super key** is any attribute set that uniquely identifies a tuple. A **candidate key** is a minimal super key: removing any attribute destroys that guarantee. With both `id` and `email` constrained as unique and non-null, `{id}` and `{email}` are candidate keys, while `{id, email}` is a non-minimal super key. An observed sample with unique names does not prove that names are keys; the guarantee must follow from the rules.

The chosen candidate is the **primary key**; the others are **alternate keys**. A **composite key** contains several attributes. Heron's `(show_id, seat_id)` identifies an inventory row because A7 appears in several shows. `seat_id` alone cannot identify that row. A **foreign key** requires the referencing values to match an allowed key in another relation, subject to its NULL semantics.

@fig dbms_key_lattice | Illustrative identity rules. The combined user attributes are unique but not minimal; the show-seat pair needs both attributes.

A **natural key** comes from domain facts, such as a stable registration code. A **surrogate key** is an identifier introduced for storage identity, such as a generated customer ID. Surrogates do not remove natural uniqueness rules: adding an ID while allowing duplicate active email addresses merely hides the duplicate behind different IDs. Choose natural keys when stability and size are suitable; choose surrogates when references should survive changes to mutable facts.

:::interview Interview lens
**"Can a table have several candidate keys?"** Yes. Each is a different minimal attribute set that identifies a row under the declared rules. The primary key chooses one for the main identity, while the remaining candidates need their own uniqueness and non-null guarantees. Minimal means no attribute can be removed, not that every candidate has the smallest possible attribute count.
:::

### Proving the identity instead of guessing it

Imagine `users(id, email, name)` with an explicit rule that id and email each identify one customer, while names may repeat. If two rows agree on id, they must be the same customer. If they agree on email, the uniqueness and non-null rules make the same claim. If they agree only on name, the rules do not exclude two different customers called Ada.

To test `{id,email}`, remove email: id still identifies the customer. Remove id instead: email still identifies the customer. The combined set is therefore a super key, but it has unnecessary attributes and is not a candidate key. This is a proof using the schema's rules. A sample containing different names for every customer cannot turn name into a guaranteed key.

| Attribute set | Guaranteed unique? | Minimal? | Classification |
|---|---|---|---|
| `{id}` | Yes | Yes | Candidate key |
| `{email}` | Yes, under stated rules | Yes | Candidate key |
| `{id,email}` | Yes | No | Super key |
| `{name}` | No guarantee | Not applicable | Not a key |

Now test Heron's inventory. `(show_id, seat_id)` identifies one row. Removing show_id merges the afternoon A7 and the evening A7. Removing seat_id merges A7 and A8 in the same show. Neither remainder is a key, so the pair is minimal under the declared rules.

A foreign key has a different job from a candidate key. Several bookings can reference Ada's id, so `bookings.user_id` need not be unique. It verifies that the referenced customer exists; it does not say that a customer can own only one booking. Adding UNIQUE there would change the business cardinality, rather than merely strengthen the same reference check.

## 5. Constraints and referential actions

A booking references a customer who has been deleted. Another row has a negative price. Those errors are different: one breaks a relationship; the other violates a value rule. Give each a constraint that expresses the intended invariant.

`NOT NULL` requires a value. `UNIQUE` rejects duplicate constrained values under the engine's NULL rules. `PRIMARY KEY` combines uniqueness with non-null identity. `FOREIGN KEY` checks a reference. `CHECK` tests a condition, and `DEFAULT` supplies a value when a write omits one. A default does not validate later values, and a check such as `price >= 0` does not by itself reject NULL: in PostgreSQL, TRUE or UNKNOWN satisfies the check. Combine it with `NOT NULL` when absence is invalid. See the [PostgreSQL constraint reference](https://www.postgresql.org/docs/18/ddl-constraints.html).

@fig dbms_constraints | A seat claim must satisfy both its references and its uniqueness rule. This is a conceptual admission path, not a prescribed engine evaluation order.

**Entity integrity** requires meaningful unique row identity. **Referential integrity** requires relationships to point at valid referenced rows. A nullable foreign key may represent "not assigned yet". For composite foreign keys, `MATCH SIMPLE` and `MATCH FULL` differ in their treatment of partially NULL references; do not apply a single-column intuition blindly.

| On deletion or key update | Result | Heron interpretation |
|---|---|---|
| `RESTRICT` | Refuse a referenced change | Keep an event with sold tickets |
| `NO ACTION` | Check the relationship at the required check time | Can differ from immediate restriction |
| `SET NULL` | Remove the reference | Optional association becomes absent |
| `CASCADE` | Propagate deletion or key update | Remove owned subordinate records |

A cascading delete is a domain decision. Deleting a customer should not silently erase financial history unless the schema explicitly intends that result. Constraints can sometimes be deferred to transaction end, which changes check timing without making invalid committed state acceptable.

:::warn Watch out
`UNIQUE` is not universally identical to a primary key minus its name. NULL treatment varies by database and configuration. A nullable unique email is not a candidate key for every row. PostgreSQL also offers `NULLS NOT DISTINCT` when NULL should participate in duplicate rejection.
:::

### NULL combinations in a composite reference

For a composite foreign key `(show_id, seat_id)`, MATCH SIMPLE exempts a row from the match check if either referencing component is NULL. MATCH FULL permits all components to be NULL together, but rejects a partially NULL pair. Fully populated pairs must find a referenced row under either rule. NOT NULL constraints can rule out those exempt cases altogether.

| Referencing pair | MATCH SIMPLE | MATCH FULL |
|---|---|---|
| `(evening,A7)` | Must match inventory | Must match inventory |
| `(NULL,NULL)` | Exempt from match | Exempt from match |
| `(evening,NULL)` | Exempt from match | Reject partial absence |
| `(NULL,A7)` | Exempt from match | Reject partial absence |

A nullable reference can represent an optional relationship. A partially known reference can be misleading because it names neither a complete show seat nor a deliberately absent one. MATCH FULL is useful when those are the only intended possibilities. Foreign keys can also reference the same table, as with an employee's manager, provided the referenced key and lifecycle rules are valid.

### Write the invariant into the schema

The following inventory fragment expresses three independent decisions: the show-seat pair is the identity, every row has a state, and the state is drawn from the declared set. The price must exist and cannot be negative. Notice how NOT NULL and CHECK work together rather than one silently replacing the other.

```sql
CREATE TABLE show_seats (
  show_id text NOT NULL REFERENCES shows(id),
  seat_id text NOT NULL,
  state text NOT NULL DEFAULT 'free'
    CHECK (state IN ('free', 'held', 'sold')),
  price integer NOT NULL CHECK (price >= 0),
  PRIMARY KEY (show_id, seat_id)
);
```

An insertion omitting state gets `free`. An insertion explicitly supplying NULL does not use the default to rescue it; it violates NOT NULL. An insertion supplying `broken` violates the state check. A repeated pair violates the primary key. A nonexistent show violates the foreign key. Each error points to a different mistaken claim about the data.

A referencing booking item needs the same pair. Checking seat_id alone against a seats catalogue proves that a physical seat exists, but not that the seat is part of the booked show. A composite foreign key to `show_seats(show_id, seat_id)` expresses that stronger relationship.

Deleting a show now forces a choice. Restricting deletion protects existing bookings but means the application must archive rather than blindly delete. Cascading from a show into its inventory can be sensible for a draft show with no purchases, while cascading into paid history may be incorrect. SET NULL works only if the referencing columns permit absence and the remaining row still has a coherent meaning. Referential actions are part of the model's lifecycle, not housekeeping shortcuts.

## 6. ER modelling and relational conversion

Heron sells the same seat in different performances, and a booking can contain several seats. If you attach one `seat_id` directly to a customer, the model loses the show and cannot represent a multi-seat booking. Draw the domain relationships before choosing columns.

An **entity** is an identifiable object in the model. An **ER relationship** connects entities. Attributes describe entities or relationships. A **strong entity** has its own identity; a **weak entity** needs an owner's identity plus its own discriminator. Heron's show seat can be modelled as dependent on a show, with seat code as discriminator; the **identifying relationship** contributes the owner's key to its identity.

**Relationship cardinality** describes maximum multiplicity: one-to-one, one-to-many or many-to-many. **Participation** describes whether membership is required. Each booking must have an owner, but a customer may have no bookings. A non-null foreign key enforces the booking's owner reference; it does not force every customer to create a booking.

@fig dbms_er | The illustrative booking model separates ownership from seat membership. Arrows show the conceptual one-to-many relationships, not query execution.

A one-to-one relationship becomes a foreign key with an appropriate uniqueness rule, usually on the dependent side. A one-to-many relationship puts the foreign key on the many side. A many-to-many relationship becomes an **associative table**, also called a junction table, containing references to both sides and any relationship attributes. `Student`, `Course` and `Enrollment(student_id, course_id, grade)` follow exactly that pattern.

A **composite attribute** has meaningful components, such as an address split into street and city. A **multivalued attribute**, such as customer phone numbers, usually becomes a child table. A **derived attribute** comes from other facts, such as total booking price. Storing it introduces an update obligation. ER notation helps discuss the model, but its arrows are not a substitute for the database constraints that implement the rules.

:::story Picture this
A ticket envelope belongs to one customer but can contain several tickets. The envelope is the booking, and each enclosed ticket records a show and seat. Writing the customer name on every physical seat would mix ownership, purchase and inventory into one object.
:::

:::note Model before optimization
ER modelling decides which facts exist and how they relate. Normalization checks their dependencies. Indexing chooses an access path after those decisions; a fast index cannot repair an ambiguous identity rule.
:::

### Convert the student-course example step by step

A student can take many courses, and each course can have many students. Putting course_id on Student would permit only one course per student. Putting student_id on Course would permit only one student per course. Neither represents the stated many-to-many relationship.

Create `Student(student_id, name)` and `Course(course_id, title)` for the independent entities. Then create `Enrollment(student_id, course_id, grade)` for the relationship. Its foreign keys establish both references. If a student can enrol once per course, the pair is the relationship's candidate key. If retakes are legitimate, the model needs another identifying attribute such as an offering or attempt; suppressing those records with an incorrect UNIQUE constraint would enforce the wrong domain.

The grade belongs to Enrollment because the same student has different grades in different courses and the same course gives different students different grades. This ownership question is the useful modelling habit: which object's identity determines this fact? The answer will become a functional dependency in the normalization part.

For a one-to-one profile, `profiles.user_id` can be both a foreign key and unique, or its primary key can be the same user id. For a weak booking item, `(booking_id, line_code)` can identify a line only within its owner's booking. For a multivalued phone attribute, `user_phones(user_id, phone)` lets each phone membership occupy a row. A derived booking total has no independent identity; if stored, it needs a maintenance rule. All these transformations follow the same domain questions rather than a memorized diagram symbol.

:::key In one breath
Candidate keys are minimal uniqueness guarantees; primary and alternate keys choose how to express those guarantees. Foreign keys enforce references, with NULL and referential actions handled explicitly. ER cardinality and participation answer different questions, and a many-to-many relationship needs a junction table. Heron's booking items connect bookings to show seats without confusing customer identity with inventory identity.
:::
