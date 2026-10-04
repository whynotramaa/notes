@part IV | Dependencies and normalization | A schema should say where each fact belongs and what determines it. Repeating a fact in unrelated rows makes insertions, updates and deletions change more than they should. We will compute dependencies and keys, then use them to test normal forms and safe decompositions. | where:4

## 14. Functional dependencies and inference rules

Two inventory rows have the same show and seat but different prices. If the model says each show seat has one current price, those rows cannot both be legal. That rule is stronger than the observation that today's sample happens to contain no conflicting values.

A **functional dependency**, or FD, $X \rightarrow Y$ means that any two tuples agreeing on attribute set $X$ must agree on attribute set $Y$. Read it as "X determines Y." It is a statement about every legal instance under the domain rules, not a causal claim and not a statistical correlation. `(show_id, seat_id) → price` holds in Heron's current-price inventory; `seat_id → price` need not hold across shows.

A **trivial dependency** has $Y \subseteq X$. A non-trivial dependency has at least one right-side attribute outside $X$. A completely non-trivial dependency has disjoint sides. These distinctions tell you which dependencies constrain state rather than merely follow from equality on the determinant itself.

@fig dbms_fd | Attribute letters name sets, not numerical values. An observed instance can disprove a proposed FD, but cannot establish the domain rule by itself.

**Armstrong's axioms** are sound and complete inference rules for FDs. Reflexivity says a set determines any subset. Augmentation says if $X \rightarrow Y$, then $XZ \rightarrow YZ$. Transitivity says if $X \rightarrow Y$ and $Y \rightarrow Z$, then $X \rightarrow Z$. Here juxtaposition means union of attribute sets.

Union combines right sides with the same determinant; decomposition separates them. Pseudotransitivity combines $X \rightarrow Y$ and $WY \rightarrow Z$ into $WX \rightarrow Z$. The intuition is substitution: knowing $X$ supplies $Y$, so knowing $WX$ supplies the input needed to determine $Z$. These rules let us prove keys without listing every possible row.

:::note FD scope
A rule about a current assignment can fail in a history table that preserves earlier assignments. Add the identifying time or version to the determinant when the domain requires it. Dependencies follow the meaning of the relation.
:::

### Equal determinants must force equal dependents

Check the inventory rule with two rows for the same show and seat. If both have price 120, they agree with `(show_id, seat_id) → price`, although duplicate identity may violate a separate key constraint. If one has price 120 and the other 80, that pair disproves the FD in the instance. The rule does not require different seats to have different prices: two distinct determinant values can legitimately map to the same dependent value.

This is the difference between a functional dependency and a one-to-one mapping. X determining Y does not imply Y determines X. Knowing a seat identity determines its price; knowing 120 does not determine which seat it is. The FD is therefore directional even when the values look unique in a small printed sample.

Armstrong's augmentation is safe because adding information cannot destroy a known determination. If show-seat identity supplies price, then adding state to the left still supplies price and state on the right. Transitivity is safe because a determined intermediate supplies the input to the next determination. Reflexivity records that equal values on an attribute set already imply equality on its subset. These arguments explain why the rules hold rather than merely naming them.

## 15. Attribute closure and candidate keys

Someone claims `{A,C}` is a candidate key for a relation with attributes `A,B,C,D`. Before accepting it, ask whether `A` alone already determines every attribute. Uniqueness without minimality proves a super key, not a candidate key.

The **attribute closure** $X^+$ is the set of attributes implied by $X$ under the chosen FD set. Start with $X$, repeatedly add the right side of any FD whose left side is already present, and stop when nothing changes. The **closure of an FD set**, $F^+$, is the set of all FDs implied by $F$; computing an attribute closure tests membership without explicitly enumerating that much larger set.

Take `A → B`, `B → C` and `AC → D`. Starting from `{A}`, the first rule adds B, the second adds C, and the last now adds D. Thus $A^+=\{A,B,C,D\}$. Read this as "A's closure contains the full relation." `{A}` is a candidate key because its only proper subset is empty and the rules do not let the empty set derive these attributes.

@fig dbms_closure | Illustrative closure, reproduced by the number script. Adding C to A would produce a super key with an unnecessary attribute.

```python
def closure(seed, rules):
    known = set(seed)
    while True:
        before = known.copy()
        for left, right in rules:
            if set(left) <= known:
                known.update(right)
        if known == before:
            return known
```

To find all candidate keys, start with attributes that never appear on a right side because they cannot be derived from others, then add possible attributes and test closure and minimality. This is a useful search reduction, not a guarantee of a small search: a relation can have many candidate keys. Check every candidate relevant to the normal-form test; choosing the primary key does not erase the other candidates.

### Find every minimal key in the instructor example

In `R(student, course, instructor)`, use `(student, course) → instructor` and `instructor → course`. The closure of student alone stays student. Course alone stays course. Instructor alone gains course but cannot gain student. No singleton determines the full relation.

Student plus course gains instructor, so its closure is the full relation. Student plus instructor gains course, so that pair also has full closure. Course plus instructor still lacks student. The two successful pairs are minimal because their singleton subsets fail. The full three-attribute set is a super key, but neither minimal nor another candidate key.

Notice the search shortcut. Student never occurs on a right side of these FDs, so every candidate key must include student. We only need to consider which companion supplies the missing attributes. In a different FD set the shortcut may leave many combinations; the closure algorithm still gives the deciding proof.

The number script checks these closures and verifies the cover-equivalence examples over every subset of the toy attribute set. A key solution should show the closure steps and minimality check, so another reader can reproduce it without accepting the label on trust.

## 16. Minimal covers and extraneous attributes

A dependency list can describe the correct rules yet contain duplicates and unnecessary attributes. Those extras make normalization harder to reason about. A **minimal cover**, often called a canonical cover under a stated convention, is an equivalent FD set with unnecessary parts removed.

First split right sides into single attributes. Then remove **extraneous attributes** from determinants when removing them preserves implication. Finally remove redundant dependencies that the rest already imply. Some canonical-cover conventions recombine rules with the same determinant; state which form you mean rather than treating the resulting spelling as unique.

Take `A → BC`, `B → C` and `AB → D`. Split `A → BC` into `A → B` and `A → C`. Because A supplies B, A can satisfy the input of `AB → D`, so B is extraneous there: replace it with `A → D`. Now `A → C` follows through `A → B` and `B → C`, so remove it. The resulting singleton cover is `A → B`, `B → C`, `A → D`.

@fig dbms_cover | Illustrative reduction. Each removed component has an implication proof; removing text because it "looks redundant" is not sufficient.

When testing whether an entire dependency is redundant, compute the determinant's closure using the other dependencies, excluding the candidate rule. Otherwise the rule proves itself. To test a left-side attribute, ask whether the remaining determinant can still derive the right side under the current rules. Recompute after each accepted change; a simultaneous batch of individually plausible removals can destroy equivalence.

The payoff is operational: a clean cover feeds dependency-preserving synthesis. It also gives interview solutions a reproducible proof rather than an intuitive guess. Minimal covers need not be unique even when their implied FD sets are identical.

### Perform the redundancy test without circular reasoning

For the split cover, temporarily remove `A → C`. Compute A's closure using the remaining rules. `A → B` adds B, `B → C` adds C, and `AB → D` can add D. Since C still appears, the removed FD is implied and may be dropped.

For the determinant in `AB → D`, ask whether A alone still supplies D under the current set. A supplies B, so it supplies both inputs of the original AB determinant. The fact that the old rule remains available here is appropriate: we are testing an attribute inside that rule, not pretending to remove the whole dependency. The resulting A → D has the same effect because B was already derivable from A.

By contrast, dropping B from `AB → D` in a set with no way for A to derive B may lose the dependency's meaning. The notation looking shorter is not evidence. Test closure using the exact current FD set and verify that the final cover implies the original set and vice versa.

A singleton-right-side minimal cover has no right-side attribute left to discard without removing a dependency. A combined canonical cover may require right-side redundancy checks too. This explains why exam answers can show different equivalent covers when they state different grouping conventions.

## 17. Insertion, update and deletion anomalies

Suppose every booking row repeats its venue's address. Correcting an address requires changing every booking for that venue. Missing one update leaves contradictory facts. The repeated address depends on the venue, not on the booking that happens to carry it.

An **update anomaly** requires several copies of one fact to change together. An **insertion anomaly** prevents recording one fact without an unrelated fact, such as a venue before its first booking. A **deletion anomaly** loses an independent fact when the last carrier row disappears, such as losing the venue address when its last booking is deleted.

@fig dbms_anomalies | The same modelling mistake produces several anomalies. Separating venue facts from booking facts removes their accidental lifecycle coupling.

**Normalization** organizes relations according to dependencies so facts do not acquire unnecessary repetition and coupling. Split the venue into `venues(venue_id, address)` and make shows reference it. A booking can then disappear without deleting a venue. The repair adds a join when the application needs both facts, so correctness and read cost must both enter the design.

Do not infer that every duplicate byte is an anomaly. Several booking items can legitimately have the same price, because each line's agreed purchase price is a separate historical fact. Conversely, repeating a mutable venue address is duplication of one current fact. Ask what the attribute means and which determinant owns it before deciding to split or cache it.

:::story Picture this
Printing a supplier's current phone number on every active order forces every order sheet to change when the supplier changes numbers. Keep one supplier card and let orders reference it. A phone number printed as a historical contact-at-purchase is a different fact and need not change.
:::

### Repair the ownership of a fact

Consider `Bookings(booking_id, venue_id, venue_address, customer_id)`, with booking_id determining the entire row and venue_id determining venue_address. Inserting a booking copies the address. Changing the venue's current address must update every such copy. Removing the final booking erases the only stored address, although the venue still exists.

Split out `Venues(venue_id, venue_address)` and retain `Bookings(booking_id, venue_id, customer_id)`. A foreign key makes the booking's venue reference valid. The address can now be inserted, changed or retained independently of a booking. Joining on venue_id reconstructs the combined view when a report needs it.

The distinction between current and historical meaning matters. If `venue_address` means the address printed on a purchased ticket at purchase time, its dependence is on that purchase's historical agreement. Updating every old ticket to today's address would destroy history rather than repair redundancy. Label the attribute's meaning before deciding that two equal strings are copies of the same fact.

## 18. First and second normal forms

An enrolment row stores a comma-separated list of courses. Queries must parse a cell to tell whether the student takes databases. The cell's hidden collection prevents the relation from representing each enrolment as a tuple.

**First normal form**, or 1NF, uses values treated as atomic in the chosen domains, with no repeating groups that the relational design intends to query as separate facts. Atomicity depends on the intended domain: a date can have meaningful components yet still be one date value. Use `Enrollment(student, course)` for individually queryable course membership rather than a text list.

A **prime attribute** belongs to at least one candidate key. **Second normal form**, or 2NF, requires 1NF and no non-prime attribute to depend on a proper subset of a candidate key. In `Enrollment(student, course, student_name)`, the key is `(student, course)` while `student → student_name`. The name repeats for every course because only part of the key determines it.

@fig dbms_partial | Illustrative decomposition into student facts and enrolment facts. The relation's candidate key is the pair, not just the chosen label on a diagram.

Split into `Student(student, student_name)` and `Enrollment(student, course)`. Now each non-prime fact belongs to its determinant. A relation whose candidate keys are all single attributes cannot have a partial dependency on a proper nonempty subset of one of them, but it can still violate later normal forms.

Test all candidate keys, not only the primary key. An apparently safe single-column primary key does not excuse a partial dependency on another composite candidate key. Normal forms concern the relation's logical dependencies; adding a surrogate ID alone does not remove the business dependencies in its attributes.

### A row-by-row partial-dependency example

Ada enrols in databases and networks. The combined relation stores Ada's name on both course rows. Changing her recorded name requires changing both, although the name belongs to the student and the grade belongs to the student-course pair. A partial dependency is exactly that mismatch between a fact's determinant and the full candidate key.

After splitting, Student has one name fact for Ada, while Enrollment retains both course memberships and their individual grades. A join restores the original printed layout without forcing the name to be maintained in every course row. The extra join is the read cost paid for separating the update responsibilities.

Adding a generated enrolment_id does not make the original duplication disappear. The student-course pair remains an alternate candidate key if its uniqueness is still a domain rule, and the name still depends only on student. The logical dependency test therefore sees the same partial dependency even if the primary key is now a singleton. This is why normal forms are tested against candidate keys and FDs rather than the physical primary-index choice.

## 19. Third normal form versus BCNF

Every instructor teaches exactly one course, but a student can study a course under different instructors in different legal situations. Take `R(student, course, instructor)` with dependencies `(student, course) → instructor` and `instructor → course`. This example exposes the difference hidden by the slogan "remove transitive dependencies."

**Third normal form**, or 3NF, requires that every non-trivial FD $X \rightarrow A$ have either a super-key determinant $X$ or a prime right-side attribute $A$. Read it as "each dependency either starts from a key or ends in an attribute belonging to a candidate key." That prime-attribute allowance is the exact distinction people omit.

The candidate keys here are `(student, course)` and `(student, instructor)`. Instructor alone does not determine a student, so it is not a super key. Yet course is prime because it belongs to the first candidate key. The dependency `instructor → course` therefore satisfies 3NF.

**Boyce-Codd normal form**, or BCNF, requires every non-trivial FD to have a super-key determinant, with no prime-attribute exception. The same relation fails BCNF. It can repeat an instructor's course across students even though it passes 3NF.

@fig dbms_bcnf | Illustrative 3NF-but-not-BCNF relation. The exception involves an attribute in a candidate key, not any arbitrary non-key column.

A BCNF decomposition into `InstructorCourse(instructor, course)` and `StudentInstructor(student, instructor)` is lossless under `instructor → course`. It can lose local enforcement of `(student, course) → instructor`: each individual table may be valid even while their join gives a student several instructors for the same course. The next sections separate losslessness from dependency preservation.

:::interview Interview lens
**"Why would you keep a 3NF schema instead of forcing BCNF?"** BCNF removes more FD-based redundancy, but its decomposition can lose dependency preservation. A 3NF synthesis can retain constraints that are enforceable within individual relations. I would state the actual dependencies and compare update obligations with the cost of enforcing a rule across joins, rather than choosing from the normal-form name alone.
:::

### The ordinary transitive case and the exceptional prime case

First use an easier relation `Employee(employee_id, department_id, office)`. Suppose employee_id determines department_id and department_id determines office. If several employees share a department, its office is repeated. Department_id is not a super key for Employee, and office is not prime. The department-to-office FD violates both 3NF and BCNF. Splitting Department from Employee gives each office one owner.

The instructor relation differs because course is prime. The prime exception allows the dependency even though instructor does not identify a whole original tuple. That is the actual reason it passes 3NF. Saying "3NF removes every transitive dependency" would erase the distinction and classify the example incorrectly.

To see the enforcement cost of the BCNF split, insert `InstructorCourse(i_lee, databases)` and `InstructorCourse(i_kim, databases)`, then `StudentInstructor(Ada, i_lee)` and `StudentInstructor(Ada, i_kim)`. Each decomposed relation respects its local key. Their join assigns Ada two instructors for the same course, violating the original `(student, course) → instructor`. A cross-relation check would be needed to reject that state. The decomposition has preserved the ability to represent valid original data without preserving this rule locally.

## 20. Multivalued dependencies, 4NF and 5NF

Ada speaks English and Hindi, and independently enjoys chess and cycling. A table `Interests(student, language, hobby)` must include every language-hobby combination if each fact is independent. Merely enforcing ordinary FDs does not remove that repetition.

A **multivalued dependency**, $X \twoheadrightarrow Y$, says that for a given X, the Y values vary independently of the remaining attributes. Read it as "X independently determines the set of Y values." With two languages and two hobbies, Ada requires $2 \times 2=4$ combinations. Keeping the sets in `Languages(student, language)` and `Hobbies(student, hobby)` preserves the independent facts without their product.

@fig dbms_fourth | Illustrative independent sets. Four combined rows encode two language memberships and two hobby memberships.

**Fourth normal form**, or 4NF, requires every non-trivial multivalued dependency to have a super-key determinant. A dependency is trivial if its right side is contained in its left side or together they cover the full relation. The independence assumption is decisive: if Ada cycles only while speaking Hindi in the domain's intended meaning, the facts are paired and this decomposition would invent combinations.

A **join dependency** states that a relation equals the join of specified projections. **Fifth normal form**, or 5NF, requires its non-trivial join dependencies to be implied by candidate keys. The classic supplier-part-project relation can require a decomposition into several pairwise relations, but only when the domain genuinely asserts the corresponding join dependency. Pairwise compatibility does not generally prove that every compatible triple exists.

For revision, explain the source of repetition before naming the form: partial FDs lead to 2NF problems, non-key FD determinants to 3NF or BCNF problems, independent multivalued facts to 4NF problems, and irreducible multiway join dependencies to 5NF problems. Higher forms do not license splitting a relation without a proof.

### Independence is the assumption you must be able to say aloud

In the language-hobby example, Ada's two language facts and two hobby facts require four product rows. Removing only the English-cycling tuple would claim that the memberships are no longer independent, even though neither the language set nor the hobby set changed. The repeated table is encoding combinations implied by the domain rather than new independent facts.

The split stores two language memberships and two hobby memberships. Their join regenerates four combinations exactly because independence is the rule. If the original relation instead describes the language used during a particular hobby session, the pair matters and the same split would generate invented sessions. 4NF reasoning begins with that semantic difference, not with the shape of the table.

In the supplier-part-project case, a pairwise join can similarly generate a supplier-part-project triple absent from the original data. It is correct only when the stated join dependency asserts that the pairwise facts are sufficient. A plausible-looking diagram is not proof of a join dependency. At interview depth, the useful answer identifies the domain assertion and the risk of inventing combinations, even when a full chase derivation is outside the question.

## 21. Lossless decomposition and dependency preservation

Split a table and join it back. If the join invents combinations, a query can now claim facts nobody inserted. Preserving every original row is not enough; reconstruction must also avoid spurious rows.

A **lossless decomposition** guarantees that joining the projections reconstructs exactly the original relation for every legal instance. For a binary decomposition into $R_1$ and $R_2$, the FD test is that the shared attributes determine all of at least one side under $F^+$:

$$
(R_1 \cap R_2) \rightarrow R_1 \quad\text{or}\quad (R_1 \cap R_2) \rightarrow R_2.
$$

Read this as "the intersection must determine one complete component." $R_1$ and $R_2$ denote attribute sets, and the arrows use the relation's implied FDs. For `R(A,B,C)` with `A → B`, splitting into `AB` and `AC` is lossless because their common A determines AB.

@fig dbms_lossless | Illustrative binary decomposition. A common column alone is not enough; it must supply the determinant guarantee.

**Dependency preservation** means the projected dependencies can enforce all original FDs without joining the decomposed relations. The BCNF example from Section 19 is lossless but can fail this property. These are independent questions: can we reconstruct the data correctly, and can we check the rules locally?

A 3NF synthesis starts from a minimal cover, creates relations for determinants and dependents, removes contained relations and adds a relation containing a candidate key if needed. Under the standard construction, it yields a lossless, dependency-preserving 3NF design. Multiway losslessness may require a chase-style proof; applying the binary test to arbitrary pairs is not a general proof of the full decomposition.

### Why the common-key test prevents spurious tuples

A candidate reconstruction combines an AB tuple with an AC tuple that share A. Under `A → B`, all original rows with that A have the same B. The C taken from the AC tuple therefore belongs to an original row whose B is exactly the B selected from AB. Their combination already existed. This is the mechanism behind the lossless binary test.

If the common attribute does not control either side, each projection can forget which B was paired with which C. Joining the projections then combines each matching B with each matching C for the same A. The resulting extra tuples are spurious because the common value cannot recover the original pairing. Keeping all original rows as a subset of the join does not repair that loss of association.

For a concrete lossy input, take `(a,b_1,c_1)` and `(a,b_2,c_2)` with no FD from A to B or C. Projection AB keeps `(a,b_1)` and `(a,b_2)`; projection AC keeps `(a,c_1)` and `(a,c_2)`. Joining on a produces four tuples. The crossed combinations `(a,b_1,c_2)` and `(a,b_2,c_1)` were never present.

@fig dbms_lossy_rows | Illustrative reconstruction failure. Two original tuples generate four joined tuples because their B-C pairing was forgotten.

Now impose A → B. Both originals with a must share the same B, so there is no competing B to cross with C. Their projections reconstruct exactly the original pairs. The declared dependency supplies the information needed to make the split safe.

Dependency preservation asks a different question after reconstruction is settled. Can the engine reject an invalid new instance by checking each table's own FDs, or must it join them to discover the violation? A design can have a perfect reconstruction proof and still need an expensive cross-table rule. State both answers whenever comparing 3NF synthesis with a BCNF decomposition.

## 22. Denormalization as a maintained invariant

Heron's checkout page wants the booking total repeatedly. Recomputing it from every item is correct, but an application may choose to cache it in `bookings.total`. The stored total is now another copy of a fact derived from the item rows.

**Denormalization** deliberately stores redundant or precombined data to serve an access pattern. A cached sum, duplicated lookup label or materialized reporting table can reduce read work. The price is an invariant between the source and the copy, plus storage and additional write work.

@fig dbms_denorm | The cached total has an authoritative source and an explicit repair path. Calling the design denormalized does not make disagreement acceptable.

Choose when the copy updates. A transaction can change items and the total together. A background process can update the copy later if readers accept staleness. A materialized view has its own refresh policy. Each choice needs a clear definition of acceptable delay and a reconciliation query that detects drift. Retrying an update must not add an item's contribution twice.

The query fixture's booking values total $120+120+80=320$. If a customer-reporting cache says 400, the problem is a broken maintenance rule, not a competing interpretation of the data. Keep purchased prices as historical facts rather than recalculating old bookings from today's mutable inventory price.

### A safe cached-total transition

For a separate illustrative item example, suppose a new booking contains two 120-unit lines, so its cached total is 240. Removing one line should delete that line and set the total to 120 in the same local transaction, or enqueue a well-defined later recomputation under a stated stale-read contract. If the process crashes between independent committed writes, the cache and source disagree.

An incremental update that subtracts 120 on every retry can also be wrong: a retried request might subtract the same contribution twice. A recomputation from authoritative lines is naturally easier to make repeatable, while an incremental scheme needs an idempotent operation identity or another admission rule. The choice is about the complete write lifecycle, not just saving a SUM query.

For a reporting copy updated asynchronously, readers should know the freshness boundary, and the operator should be able to compare it with the authoritative source. Keeping a duplicate that nobody can reconcile makes the performance shortcut harder to trust as soon as failures or retries occur.

:::warn Watch out
"Denormalize for performance" is incomplete. Name the measured slow query, the duplicated fact, its authoritative owner, the update mechanism and the staleness contract. A surrogate ID or a new index does not remove a functional dependency.
:::

:::key In one breath
Dependencies describe every legal instance, and closures prove keys and implied rules. A minimal cover removes unnecessary determinants and dependencies without changing their meaning. Normalization assigns facts to their determinants, while losslessness and dependency preservation test different properties of a split. Denormalization is a decision to maintain another copy of a fact, with a specified update and repair rule.
:::
