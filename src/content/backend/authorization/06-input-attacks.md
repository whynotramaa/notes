@part VI | Input attacks | We study the specific ways attackers exploit weak input handling. Each attack here has caused real breaches, and each one is stopped by a precise rule rather than by general caution. We will cover mass assignment, parameter pollution, prototype pollution, type confusion and integer overflow, Unicode normalization, regex denial of service and file validation. | where:6

## 18. Mass assignment

Wren's profile endpoint lets Asha update her name and phone number. The handler reads the JSON body and calls `user.update(**body)`, a one-liner that copies every field in the request onto the user model and saves it. Asha's app only ever sends `name` and `phone`. An attacker sends `{"name": "Asha", "role": "admin", "credit": 100000}`, and the framework dutifully sets all three columns. This is **mass assignment**, binding request fields to internal object fields that the client should never control.

@fig be_mass_assignment | The framework copied every field. The two the client never should have set were the ones that mattered.

The attack became famous in 2012, when a researcher used it on GitHub, a Rails application, to add his public key to the Rails organisation's repository and push a commit to prove the point. Rails then made strong parameters, an explicit list of permitted fields per action, the default. Every framework with automatic binding, including Spring, ASP.NET, Laravel, Django REST Framework and Mongoose, has the same exposure.

The fix is to never bind requests directly to persistence models. Define a **DTO** (data transfer object) per request type that lists exactly the fields a client may send, such as `UpdateProfileRequest {name, phone}`, validate into that, and copy the permitted fields onto the model by hand or with an explicit mapping. Combined with rejecting unknown fields from Section 17, an extra `role` field returns 422 instead of silently promoting someone. Fields such as `role`, `tenant_id`, `owner_id`, `verified`, `balance` and timestamps must only ever be set by server code.

:::story Picture this
A hotel form that says "fill in your name and phone". A guest also writes "room upgrade: presidential suite, price: 0" in the margin, and the clerk types every line on the form into the booking system without reading which boxes were printed on it. A DTO is the clerk who only copies the printed boxes.
:::

## 19. Parameter pollution

What happens when a query string contains the same parameter twice, as in `/pay?amount=10&amount=1000`? The HTTP specifications do not say, and real software disagrees. Some frameworks take the first value, some the last, and some return a list or join the values with commas. **HTTP parameter pollution** exploits that disagreement between two components in the same path.

Suppose a web application firewall in front of Wren checks that `amount` is below 500 and reads the first value, 10. The application behind it reads the last value, 1,000. The check passes and the payment uses a value nobody checked. The same trick works between a gateway that enforces authorization on `user_id` and a service that reads a different copy, or between the code that signs a request and the code that verifies it.

@fig be_param_pollution | Two parsers, two answers. The security check and the business logic disagree about what was sent.

The defence is to reject ambiguity. For parameters that should have one value, treat duplicates as a 400 error at the edge, before any component has to choose. Make sure every layer that inspects a request uses the same parser, or receives an already-parsed object from the first layer rather than re-parsing raw strings. The same principle applies to JSON objects with duplicate keys, `{"amount": 10, "amount": 1000}`, which many parsers accept silently.

## 20. Prototype pollution

JavaScript objects inherit properties from a shared prototype, `Object.prototype`. A utility that deep-merges user input into an object, such as merging a settings patch into stored settings, may follow a key named `__proto__` and write into that shared prototype instead of into the object. Send `{"__proto__": {"isAdmin": true}}`, and after the merge every object in the Node.js process, including `{}`, appears to have `isAdmin` set to true. Code that checks `if (user.isAdmin)` on a user object that lacks the property now finds the inherited one. This is **prototype pollution**.

@fig be_proto_pollution | One merged key changes the default for every object in the process.

The damage ranges from changed defaults and crashes to remote code execution, when a polluted property reaches a template engine or a child process option. Real vulnerabilities have been found in lodash's `merge`, jQuery's `extend` and many other libraries used by millions of projects, and in the servers that relied on them.

The defences are concrete. Reject the keys `__proto__`, `constructor` and `prototype` during validation. Use `Object.create(null)` for dictionaries built from user input, so they have no prototype to pollute, or use `Map`. Keep merge libraries updated. Node.js also offers a startup flag, `--disable-proto=delete`, that removes the `__proto__` accessor. Python and Ruby have related bugs, such as setting arbitrary attributes through dynamic `setattr` on user-supplied names, and the same rule of allowlisting field names applies.

## 21. Type confusion and integer overflow

Loosely typed parsing creates **type confusion**, where a value arrives as a different type than the code expects and the code behaves differently. Wren expects `"qty": 3`. A client sends `"qty": "3"`, and in JavaScript `"3" + 1` is the string `"31"`. It sends `"qty": [3, 3]`, and a check like `qty.length <= 2` passes on an array. It sends `"qty": {"$gt": 0}`, and a MongoDB query built from that field now means "quantity greater than zero", matching every document, which is NoSQL injection. Strict type validation before any comparison or arithmetic removes all of these, because each wrong type is rejected at the boundary.

@fig be_type_confusion | One field, four types. Only one of them is what the code was written for.

**Integer overflow** happens when arithmetic exceeds the range of the type that stores it. Wren stores money as integer paise, which avoids floating-point rounding. In a 32-bit signed integer, the largest value is 2,147,483,647, about 21.5 million rupees. An order for 50,000 units of a 450-rupee dish is 50,000 × 45,000 = 2,250,000,000 paise, which exceeds that limit. In a language with wrapping 32-bit arithmetic, such as Java's `int` or C, the stored total becomes −2,044,967,296 paise. A negative order total can mean a refund to the attacker or a free order, depending on what the code does next.

@fig be_int_overflow | A quantity that passed a weak check wraps a 32-bit total around to a large negative number.

The defences are layered. Bound every numeric input to a sensible range at validation, such as a quantity from 1 to 50, so the multiplication can never get close to the limit. Use 64-bit integers or decimal types for money. Compute totals on the server from trusted prices, never accept a total from the client, and check that results are in range before writing them. Python's integers do not overflow, but the database column or the payment provider's API may still use 32 or 64 bits, so the range checks still matter.

## 22. Unicode normalization

The letter é can be stored as one code point, U+00E9, or as two, the letter e (U+0065) followed by a combining acute accent (U+0301). Both display identically. They are different byte sequences, so a naive comparison says they differ. A user who registered as "José" in one form cannot log in as "José" in the other, and two accounts can exist with names that look the same. **Unicode normalization** converts text to a standard form so that equivalent strings compare equal. NFC composes characters where possible and is the usual choice for storage and comparison.

Look-alike characters are a harder problem. The Cyrillic letter а (U+0430) looks identical to the Latin a (U+0061) in most fonts, so "аdmin" with a Cyrillic first letter is a different username that looks exactly like "admin". Attackers register such names to impersonate staff, and register such domain names for phishing. Normalization form NFKC folds some compatibility characters, such as full-width letters, but it does not fold Cyrillic into Latin. That needs a separate confusables check, such as the one defined in Unicode Technical Standard 39, or a policy that limits usernames to one script.

@fig be_unicode | Same appearance, different bytes. Normalize for comparison, and check confusables for identities.

Normalization also interacts with security checks in the order from Section 16. If Wren validates a filename, then the filesystem or a later library normalizes it, a character such as the full-width solidus (U+FF0F) can turn into a real `/` after the check. Normalize first, check second, and use the normalized value from then on.

## 23. Regex denial of service

Many regex engines, including those in Python, JavaScript, Java and Ruby, use backtracking. For some patterns, a non-matching input makes them try an exponential number of ways to split the text before giving up. The classic example is `(a+)+$` against a string of n letters a followed by `!`. The engine tries every way to divide the a's between the inner and outer repetitions, about $2^n$ of them, before it fails. For n = 30 that is 1,073,741,824 steps. At an illustrative $10^8$ steps per second, one 31-byte request holds a CPU core for about 10.7 seconds. A handful of such requests per second takes Wren down. This is **ReDoS** (regular expression denial of service).

@fig be_redos | Each extra character doubles the work. A 31-byte input becomes a ten-second stall.

Real patterns trigger it less obviously, typically through nested quantifiers or overlapping alternatives, as in email validators like `^([a-zA-Z0-9]+\.?)+@`. Cloudflare's global outage on 2 July 2019 came from a regex with catastrophic backtracking in a firewall rule, which pushed CPU to 100% on servers worldwide for 27 minutes. Stack Overflow went down in 2016 when a post with 20,000 consecutive spaces hit a trimming regex.

The defences are to use a linear-time engine such as RE2 or Rust's `regex` crate for any pattern applied to untrusted input, to bound input length before matching, to avoid nested quantifiers, and to run regex-heavy work with a timeout. Static analysis tools can flag dangerous patterns in code review.

## 24. File validation

Wren lets restaurants upload menu photos. Three things claim to describe each file. The filename, `menu.jpg`, was chosen by the user. The Content-Type header, `image/jpeg`, was chosen by the client software. The bytes themselves are the only evidence. The first few bytes of a file, its **magic bytes**, identify most formats. JPEG files start with `FF D8 FF`, PNG with `89 50 4E 47`. A file named `menu.jpg` whose first bytes are `3C 3F 70 68 70`, which is `<?php` in ASCII, is a PHP script dressed as an image.

@fig be_file_validation | Filename and Content-Type are claims. Magic bytes are evidence, and decoding is proof.

Checking magic bytes is not enough on its own, since polyglot files can be valid as two formats at once. The robust approach for images is to decode them with an image library and re-encode them to a fresh file, which strips anything that is not image data, including metadata such as GPS coordinates. Enforce a size limit before reading, and a pixel-dimension limit, since a 10 KB PNG can decompress to a 50,000 × 50,000 image that exhausts memory, a decompression bomb. Generate the stored filename on the server, never use the uploaded name in a path, which prevents path traversal through names like `../../app/config.py`, and serve uploads from a separate domain so any script that slips through cannot run on Wren's origin. Unit XII builds the full upload pipeline.

:::warn Watch out
Many of these attacks pass schema validation that only checks presence and type at the top level. A deep merge, a regex, a duplicate parameter or a filename can all be "a string" and still be dangerous. Validate meaning and bounds, not just shape, and keep libraries that parse input up to date.
:::

:::interview Interview lens
**"What is mass assignment and how do you prevent it?"** It is when a framework binds every field in a request body onto an internal model, so a client can set fields it should not control, such as role, tenant or balance. GitHub was compromised this way in 2012. Prevent it with a request DTO per endpoint that lists exactly the allowed fields, reject unknown fields with 422, and set sensitive fields only in server code. Never pass a raw request body to an ORM's update method.
:::

:::key In one breath
Mass assignment binds fields like role into models, so use per-request DTOs and reject unknown fields. Parameter pollution exploits parsers that disagree about duplicates, so reject duplicates at the edge, and prototype pollution writes through `__proto__`, so block those keys and use prototype-free dictionaries. Strict types stop type confusion and NoSQL operators, bounded ranges and 64-bit money stop overflows, NFC normalization and confusable checks handle Unicode, and linear-time regex engines with input bounds stop ReDoS. For files, trust the decoded bytes, never the name or Content-Type.
:::
