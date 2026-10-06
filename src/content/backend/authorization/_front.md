<section class="front">

<div class="part-kicker">Before we start</div>

# How to read this chapter

<p class="lede">Unit III proved who is calling. This unit decides what that caller may do, whether the data they sent makes sense, and which customer's data they may touch. Most serious API breaches in the last decade failed one of these three checks, not authentication.</p>

The unit has three threads. Parts I to IV cover authorization, from the basic rules through the access control models to the single most common API bug, IDOR, and the policy engines that centralise the rules. Parts V and VI cover input validation and the attacks that slip past weak validation. Parts VII and VIII cover multi-tenancy, where one backend serves many customer organisations that must never see each other's data. Part IX traces one request through every check.

Each section opens with a concrete Wren situation, explains the mechanism, works an example with numbers and then shows a figure. *Picture this* boxes give analogies, notes add detail, *Watch out* names a real mistake, and *Interview lens* gives an answer to say aloud. *In one breath* closes each part.

By the end you should be able to look at any endpoint and list, in order, the checks it must perform and the status code each failure returns.

</section>

<section class="front">

<div class="part-kicker">The running system</div>

# Meet Wren

**Wren** is the illustrative food-ordering service from earlier units. In this unit it is also a platform. Restaurants manage their menus and orders in a Wren dashboard, so each restaurant group is a tenant. All numbers are assumptions chosen for readable arithmetic.

| Setting | Value | What it controls |
|---|---|---|
| Customer accounts | 1,000,000 | Size of role and permission tables |
| Restaurant tenants | 2,000 | Multi-tenancy design |
| Roles | customer, restaurant manager, cook, courier, support, admin | RBAC examples |
| Permissions | 40 | Role-permission table size |
| Orders | 5,000,000, ids assigned in sequence | IDOR enumeration example |
| Peak requests | 2,000 per second | Policy and cache load |
| Policy decision cache | 30 s | How long a revoked permission lingers |
| Body limit, JSON depth, array length | 1 MB, 32, 100 items | Input bounds |
| Money | integer paise (1 rupee = 100 paise) | Overflow example |

The cast for this unit is user 42, a customer called Asha who also manages restaurant 9 for the Spice Group tenant, user 43, another customer, and an attacker who holds a perfectly valid Wren account of their own.

</section>
