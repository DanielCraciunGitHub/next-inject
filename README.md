# next-inject

A modular plugin system for Next.js applications, where you can automate mundane configurations with a single click.

To authenticate with our CLI, please follow these steps:

1. Please [login](https://www.nextinject.pro/login) to gain access to your personal API key.

2. Visit the [dashboard](https://www.nextinject.pro/dashboard) to find your API key.

3. Copy and paste the command from the dashboard, it should look like this:

```bash
next-inject auth -k <KEY> # Where <KEY> is your personal API key.
```

To create a next-inject project with access to our initial boilerplate, type this command:

```bash
# Assuming you have globally installed next-inject
next-inject init
```

To bootstrap an existing Next.js project with next-inject, type this command:

```bash
# Assuming you have globally installed next-inject
next-inject bootstrap
```

To start injecting plugins, run this command:

```bash
next-inject add metadata
```

This will configure static metadata for new and existing Next.js sites for free.

_Note that this command works even if you don't have a project, **next-inject** will take care of everything for you._

Find the rest of our commands here at our [Next Inject site](https://www.nextinject.pro/plugins), here you will also find documentation for individual plugins to make the injection process smooth.
