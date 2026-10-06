@part IX | Email | We get Wren's receipts and password resets into inboxes rather than spam folders. Email is old, federated and suspicious of strangers, and delivering it reliably takes DNS records, reputation and feedback loops as much as code. We will cover the path an email takes, SPF, DKIM and DMARC, and bounces, complaints and suppression lists. | where:9

## 25. The path of an email

When order 124 is placed, Wren sends user 42 a receipt. The application does not talk to user 42's mail server directly. It puts a job on the email queue, Unit VIII, and a worker renders the message and hands it to an **email service provider**, Amazon SES for Wren, or SendGrid, Postmark or Mailgun, through the provider's API. The provider then speaks **SMTP**, the Simple Mail Transfer Protocol, defined in RFC 5321, to the recipient's mail server.

To find that server, the provider looks up the recipient domain's **MX record** in DNS, such as `gmail.com`'s mail exchangers, and opens an SMTP connection to one of them on port 25, usually upgraded to TLS with STARTTLS. It announces itself, states the envelope sender and recipient, and sends the message. The receiving server then decides what to do with it. It may accept it into the inbox, accept it into the spam folder, defer it with a temporary error, or reject it outright. That decision depends on authentication, which the next section covers, and on the sender's **reputation**, built from its history of sending mail people want.

@fig be_mail_path | App, queue, provider, SMTP to the recipient's MX, and the recipient server's verdict.

Providers exist because running reputable sending infrastructure is hard. They maintain IP addresses with good reputations, handle retries, process bounces and complaints, sign messages, and give Wren an API, webhooks and analytics. Wren still owns its domain's DNS records and its sending practices, and a provider cannot rescue a sender whose mail people mark as spam.

Wren separates two kinds of email. **Transactional email** is triggered by a user's action and expected by them, receipts, password resets, one-time codes and delivery updates. **Bulk email**, also called marketing email, goes to many people at once, promotions and newsletters. They differ in how recipients react, since people rarely mark a password reset as spam and often mark promotions, so mixing them lets a spammy campaign damage the reputation that receipts depend on.

@fig be_mail_streams | Transactional and bulk mail from different subdomains and streams, each building its own reputation.

Wren sends transactional mail from `mail.wren.example` and bulk mail from `promo.wren.example`, through separate provider configurations and, at higher volumes, separate IP addresses. At 50 receipts per second during peak, 180,000 per hour, Wren is a large sender in the eyes of Gmail and Yahoo, which brings specific requirements, section 26.

## 26. SPF, DKIM and DMARC

SMTP itself does not verify who sent a message. Anyone can connect to a mail server and claim to be `orders@wren.example`. Three DNS-based standards let receivers check, and modern mailbox providers effectively require all three.

**SPF**, Sender Policy Framework, RFC 7208, lets a domain publish which servers may send mail for it. Wren's record, `mail.wren.example. TXT "v=spf1 include:amazonses.com -all"`, says that SES's servers may send for that domain and nobody else may, with `-all` asking receivers to fail anything else. The receiver checks the connecting IP address against the record for the **envelope sender** domain, the address used in the SMTP conversation, which is often a bounce address rather than the visible From. SPF records may trigger at most 10 DNS lookups through includes and redirects, a limit that large organisations with many senders hit surprisingly often.

**DKIM**, DomainKeys Identified Mail, RFC 6376, signs each message. The sending server adds a `DKIM-Signature` header containing a signature over chosen headers and the body, made with a private key. The header names a selector and domain, such as `s1` and `mail.wren.example`, and the receiver fetches the public key from `s1._domainkey.mail.wren.example` in DNS to verify it. A valid signature proves the message was sent by someone holding the domain's key and was not modified in transit, and unlike SPF it survives forwarding.

@fig be_mail_auth | SPF checks the sending IP, DKIM checks the signature, DMARC checks alignment with the visible From and sets the policy.

**DMARC**, Domain-based Message Authentication, Reporting and Conformance, RFC 7489, ties them to the **From** address the recipient sees. It requires that SPF or DKIM passes for a domain **aligned** with the From domain, the same domain or a subdomain of it, depending on strict or relaxed alignment. Wren's record at `_dmarc.wren.example` sets the policy for failures, `p=none` to monitor, `p=quarantine` to send failures to spam, or `p=reject` to refuse them, and an `rua` address where receivers send daily aggregate reports.

@fig be_mail_dns | The three records in Wren's DNS. The DMARC policy is reject, with reports to a mailbox Wren reads.

Those reports are how Wren discovered that a forgotten marketing tool was sending mail as `wren.example` without DKIM. Rolling out DMARC usually starts at `p=none` to collect reports, fixes every legitimate sender, then moves through quarantine to reject, which stops attackers from spoofing Wren's domain in phishing emails.

Since February 2024, Gmail and Yahoo require senders of more than 5,000 messages a day to their users to have SPF, DKIM and a DMARC policy, to align the From domain, to support one-click unsubscribe in marketing mail, and to keep spam complaint rates below 0.3%. Wren meets all of them, which is now the price of reaching an inbox at all.

## 27. Bounces, complaints, suppression and retries

Not every email arrives, and the ways it fails feed back into what Wren should send next. A **bounce** is a delivery failure reported back to the sender. A **hard bounce** is permanent, the address does not exist or the domain has no mail server, and sending to it again will fail again and damage reputation, since mailbox providers treat repeated sends to dead addresses as a sign of a careless or spammy sender. A **soft bounce** is temporary, a full mailbox, a server that is down or a temporary block, signalled with a 4xx SMTP reply, and is worth retrying.

SMTP has retries built in. A sending server that gets a 4xx reply queues the message and tries again with increasing delays. RFC 5321 suggests giving up only after at least four to five days. Providers handle this for Wren, and report the final outcome, delivered or bounced, through webhooks.

A **complaint** happens when a recipient presses "report spam". Mailbox providers that offer **feedback loops** pass complaints back to the sender, and they weigh complaint rates heavily in reputation. Gmail's threshold for bulk senders is 0.3%, and staying below 0.1% is the practical target. A campaign with a 1% complaint rate can push all of a domain's mail, receipts included, into spam for weeks.

@fig be_mail_bounces | Hard bounces and complaints come back as webhooks and go on the suppression list. Soft bounces are retried.

Both feed a **suppression list**, the set of addresses Wren must not email again. Hard bounces are added at once. Complaints are added at once for bulk mail, and the user is unsubscribed. Unsubscribes from bulk mail are honoured within the legally required time and immediately in practice. Providers keep their own suppression lists, and Wren keeps its own as well, in its database, so suppression survives switching providers and is checked before a job is ever enqueued.

Transactional mail needs care here. A password reset to an address that hard-bounced last month will bounce again, so the app tells the user their email address appears to be invalid and asks them to update it, rather than silently sending into the void. And because the email job is idempotent, keyed by the order or reset request, a worker crash never sends two receipts.

The last piece is measurement. Wren tracks per stream the delivery rate, bounce rate, complaint rate and, where available, inbox placement, from the provider's analytics and from Google Postmaster Tools. A rising bounce rate usually means a data quality problem, such as signups with mistyped addresses, which email verification at signup fixes. A rising complaint rate means people do not want what is being sent, which no amount of engineering fixes.

:::story Picture this
Posting letters from a company. The post office does not check who you are, so recipients look for a letterhead they recognise, a seal that matches the one registered at the town hall, and a note from the town hall saying what to do with letters that lack either. Letters returned as "no such address" go on a do-not-send list, and if enough recipients bin your letters unread, the sorting office starts doing it for them.
:::

:::note BIMI
Brand Indicators for Message Identification lets a domain with a DMARC policy of quarantine or reject publish a logo that supporting mailbox providers show next to its messages, usually requiring a verified mark certificate. It is a visible reward for completing SPF, DKIM and DMARC, and a small signal to users that the mail is genuine.
:::

:::warn Watch out
Sending transactional mail from the same domain and IPs as marketing campaigns ties receipts and password resets to the campaign's complaint rate. One bad campaign can delay resets for every user. Separate streams, subdomains and, at volume, IP addresses.
:::

:::interview Interview lens
**"Our password reset emails are going to spam. How do you investigate?"** Check authentication first, that SPF includes the sending provider, DKIM signs with a published key, and DMARC aligns with the From domain, using the message headers' Authentication-Results. Then reputation, using Postmaster Tools and the provider's analytics for bounce and complaint rates, and whether transactional mail shares a domain or IPs with marketing. Check content and links, and whether the domain appears on blocklists. Fix by separating streams, suppressing bounces and complainers, warming new IPs gradually, and keeping complaint rates below 0.1%.
:::

:::key In one breath
Email goes from the app through a queue to a provider such as SES, which speaks SMTP to the recipient's MX, where the receiving server decides inbox, spam or reject from authentication and reputation. SPF lists which servers may send for the envelope domain, DKIM signs messages with a key published in DNS, and DMARC requires SPF or DKIM to align with the visible From and sets a policy from none to reject, with reports. Hard bounces and complaints go straight onto a suppression list, soft bounces are retried for days, transactional and bulk mail are kept apart, and complaints stay under 0.3%, ideally 0.1%.
:::
