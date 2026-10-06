@part I | Containers | We look at what a container actually is, an ordinary Linux process with a private view of the system and a limit on what it can use. Knowing the mechanism explains most of the surprises backend engineers meet, from ignored shutdown signals to memory kills. We will cover images, layers and Dockerfiles, namespaces, cgroups and overlay filesystems, PID 1 with signals and multi-stage builds, and container security. | where:1

## 1. Images, layers and Dockerfiles

Before containers, deploying Wren meant installing the right version of Python, the right system libraries and the right packages on each server, and hoping that the servers stayed alike. They never did. A library upgraded on one machine and not another produced bugs that appeared on one server in four. A **container image** solves this by packaging the application together with everything it needs to run, its runtime, libraries and files, into one immutable artifact that runs the same way on a laptop, in CI and in production.

An image is a stack of read-only **layers**, each a set of file changes, plus a small configuration that says which command to run, which user to run it as, which ports it listens on and which environment variables to set. Layers are identified by the SHA-256 hash of their contents, so identical layers are stored and downloaded once, however many images share them. Wren's services all start from the same base layer, so a node that has pulled one service's image already has most of the next.

@fig be_dep_layers | An image is a stack of read-only layers. Changing the source code rebuilds only the top layer.

Images are built from a **Dockerfile**, a list of instructions where most instructions add a layer. `FROM python:3.12-slim` picks a base image. `COPY requirements.txt .` and `RUN pip install -r requirements.txt` install dependencies. `COPY . .` adds the source. `CMD ["gunicorn", "wren.app"]` sets the command. The builder caches each layer and reuses it if the instruction and its inputs have not changed. Order therefore matters. Copying the dependency list and installing it before copying the source means that a code change, which happens many times a day, rebuilds only the last layers, while the slow dependency install is reused until the dependency list changes. Copying everything first would reinstall every dependency on every commit.

Built images are pushed to a **registry**, such as Docker Hub, GitHub Container Registry, or a cloud provider's registry, and pulled by the machines that run them. An image is named by a repository and a **tag**, `registry.wren.example/orders:v812`, but tags are mutable, and someone can push a different image under the same tag. Each image also has a **digest**, `sha256:…`, the hash of its manifest, which can never point to anything else. Wren's deploy manifests reference digests, so the image that passed testing is exactly the image that runs.

A running instance of an image is a **container**. It gets a thin writable layer on top of the read-only ones, which disappears when the container is removed. Anything that must survive, uploads, database files, goes in a **volume** mounted from outside, or better, in a managed service. That is why Wren's application containers are stateless and disposable, and why Unit XII sends uploads to object storage.

## 2. Namespaces, cgroups and overlay filesystems

A container is not a virtual machine. A virtual machine runs its own kernel on emulated hardware. A container is a normal process on the host's kernel, started with Linux features that change what it can see and limit what it can use. Two features do most of the work.

**Namespaces** give a process its own view of a system resource. A **PID namespace** gives the container its own process numbering, so its main process sees itself as PID 1 and cannot see the host's processes. A **network namespace** gives it its own network interfaces, IP address, routing table and ports, so two containers can both listen on port 8080. A **mount namespace** gives it its own filesystem tree. **UTS** gives it its own hostname, **IPC** its own shared memory, **user** namespaces can map its root user to an unprivileged user on the host, and **cgroup** and **time** namespaces hide the host's control groups and clocks. A container runtime creates a fresh set for each container.

@fig be_dep_namespaces | A container is a host process with its own namespaces and a cgroup limit. All containers share one kernel.

**Control groups**, cgroups, limit and account for what a group of processes may use. A memory limit, `memory.max` in cgroups version 2, caps the container's memory, and a container that exceeds it is killed by the kernel's out-of-memory killer, which Kubernetes reports as `OOMKilled`. A CPU limit, `cpu.max`, gives a quota of CPU time per period, by default 100 ms, and throttles the container once it uses its quota, Unit XIV. cgroups also count I/O and the number of processes, which stops a fork bomb in one container from exhausting the host.

The filesystem comes from an **overlay filesystem**, usually Linux's `overlayfs`. It stacks the image's read-only layers as lower directories and the container's writable layer as the upper directory, and presents the merged result as one tree. Reading a file finds the topmost layer that has it. Writing to a file from a lower layer first copies it to the upper layer, **copy-on-write**, so the image itself is never modified and a hundred containers from one image share its layers on disk and in the page cache.

Networking ties a container's namespace to the outside. Docker's default creates a virtual Ethernet pair, one end inside the container and one attached to a bridge on the host, with NAT for outbound traffic and port publishing for inbound. Kubernetes gives every pod its own routable IP address through a network plugin, Part II. Because the kernel is shared, containers are weaker isolation than virtual machines, which is why multi-tenant platforms run them inside lightweight VMs such as Firecracker, or under gVisor, which intercepts system calls in user space.

## 3. PID 1, signals and multi-stage builds

Wren's first containerised release had a strange bug. Every deploy took exactly 30 seconds per pod, and some in-flight requests failed. The orchestrator was sending `SIGTERM` to ask the application to stop, Part IV, and the application was ignoring it, so after the grace period the orchestrator sent `SIGKILL`, which cannot be ignored and kills mid-request. The cause was PID 1.

The process with PID 1 has two special properties in Linux. First, the kernel does not apply default signal actions to it. For an ordinary process, an unhandled `SIGTERM` terminates it. For PID 1, an unhandled `SIGTERM` does nothing. Second, PID 1 must **reap zombies**, collecting the exit status of orphaned child processes, or they pile up as defunct entries. On a normal system, an init program such as systemd does both. In a container, the application is PID 1, and most applications do neither.

@fig be_dep_pid1 | Shell form puts sh at PID 1, which does not forward SIGTERM. Exec form, or a tiny init, delivers it to the app.

Wren's Dockerfile used the **shell form**, `CMD gunicorn wren.app`, which runs `/bin/sh -c "gunicorn wren.app"`. The shell became PID 1, and `sh` does not forward signals to its child, so gunicorn never heard `SIGTERM`. The fix has two parts. The **exec form**, `CMD ["gunicorn", "wren.app"]`, runs the program directly as PID 1, so it receives the signal, and the application must actually handle `SIGTERM` by shutting down gracefully. For applications that spawn child processes, a minimal init such as `tini`, or Docker's `--init` flag, runs as PID 1, forwards signals and reaps zombies. Entrypoint scripts that set up the environment should end with `exec "$@"`, which replaces the shell with the application instead of running it as a child.

Image size is the other early lesson. Building Wren's Go services needs a compiler, build tools and source, about 1.2 GB in the build image. Running them needs only the compiled binary, about 15 MB. A **multi-stage build** uses several `FROM` stages in one Dockerfile. The first stage, `FROM golang:1.23 AS build`, compiles. The final stage starts from a minimal base, `FROM gcr.io/distroless/static`, and copies only the binary with `COPY --from=build /out/orders /orders`. The final image is about 20 MB, pulls in seconds, starts faster on new nodes, and contains no compiler, shell or package manager for an attacker to use. Interpreted languages benefit too, by installing build-time packages in one stage and copying only the installed dependencies into a slim runtime stage.

## 4. Container security

A container shares the host's kernel, so a process that escapes it, or a container given too much power, can affect everything on the node. Wren's container standards follow the principle of least privilege at every layer.

**Run as a non-root user.** By default the process inside a container runs as root, user 0. Without user namespaces, that is the same user 0 as on the host, restricted only by namespaces and capabilities. A Dockerfile line `USER 10001` runs the application as an unprivileged user, and Kubernetes' `runAsNonRoot: true` refuses to start a container that would run as root. **Rootless** container runtimes, such as rootless Podman and Docker's rootless mode, go further by running the whole runtime without root on the host.

@fig be_dep_hardening | Non-root user, dropped capabilities, read-only root filesystem, minimal base, scanned and signed image.

**Drop capabilities.** Linux splits root's powers into about forty **capabilities**, such as `CAP_NET_ADMIN` to change network settings and `CAP_SYS_ADMIN`, which covers so much it is nicknamed "the new root". Container runtimes grant a default subset. Wren's pods drop them all, `capabilities: { drop: ["ALL"] }`, and add back only what a service needs, usually nothing, since binding to ports above 1024 needs no capability. They also set `allowPrivilegeEscalation: false`, which blocks setuid binaries from gaining privileges, and `readOnlyRootFilesystem: true`, with a small writable volume for temporary files. Privileged containers, which disable nearly all isolation, are forbidden for application workloads.

**Minimal images.** Every package in an image is code that might have a vulnerability and a tool an attacker might use. Distroless and scratch images contain only the application and its runtime libraries, with no shell. Slim and Alpine variants are a middle ground. **Image scanning** with tools such as Trivy or Grype compares the packages in an image with vulnerability databases, in CI and continuously in the registry, since new vulnerabilities are published for old images every day. Wren rebuilds every image weekly from fresh base images, so patches arrive even for services nobody touched.

**Secrets never go in images.** A secret copied into a layer stays in that layer even if a later instruction deletes it, and anyone who can pull the image can read the layer. Build-time secrets use BuildKit's `--mount=type=secret`, which exposes them only during one step without writing them to a layer. Runtime secrets come from the platform when the container starts, Part II. Finally, Wren **signs** each image with Sigstore's cosign and generates a software bill of materials, and the cluster's admission policy runs only images signed by Wren's CI. That closes the path where someone pushes an image directly to the registry.

:::story Picture this
Flats in one building. Each flat has its own front door, its own letterbox number and its own view from the windows, but they share the foundations, the water main and the wiring. A good building gives each flat a fuse box with a limit, so one flat's heater cannot black out the floor, and does not give every tenant the master key. Containers are the flats, namespaces the doors and views, cgroups the fuses, and the kernel the shared foundations.
:::

:::note .dockerignore
`COPY . .` copies everything in the build context, including `.git`, local `.env` files and test data, unless a `.dockerignore` file excludes them. A leaked `.env` in an image layer is a classic way secrets reach a public registry. Wren's `.dockerignore` excludes everything except the source directories it names.
:::

:::warn Watch out
Shell-form `CMD` and entrypoint scripts without `exec` leave a shell as PID 1 that never forwards `SIGTERM`, so every shutdown ends in `SIGKILL` and dropped requests. Use the exec form, handle `SIGTERM` in the application, and add `tini` if the application spawns children.
:::

:::interview Interview lens
**"What is a container, and how is it different from a VM?"** A container is a host process isolated by Linux namespaces, which give it its own view of PIDs, network, mounts and hostname, and limited by cgroups, which cap memory, CPU and processes. Its filesystem is an overlay of read-only image layers plus a writable layer. It shares the host kernel, so it starts in milliseconds and has little overhead, but isolates less than a VM, which runs its own kernel. In production, run as non-root with dropped capabilities and a read-only filesystem, use minimal multi-stage images, scan and sign them, and make sure PID 1 handles SIGTERM.
:::

:::key In one breath
An image is a stack of content-addressed read-only layers built from a Dockerfile, ordered so dependencies cache and code changes rebuild only the top, and deployed by digest because tags can move. A container is a host process with its own namespaces and a cgroup limit, on an overlay filesystem with copy-on-write, sharing the host kernel. PID 1 ignores unhandled signals and must reap zombies, so use the exec form or tini, and multi-stage builds shrink a 1.2 GB build image to about 20 MB. Run as non-root with all capabilities dropped and a read-only root filesystem, scan and sign images, and never put secrets in layers.
:::
