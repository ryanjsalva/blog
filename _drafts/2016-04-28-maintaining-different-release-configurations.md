---
layout: post
title:  Maintaining Different Release Configurations
excerpt: this is the excerpt
tags: cordova ionic devops vsts
cover: /assets/2016-04-25-cover.jpg
cover-small: /assets/2016-04-25-cover-small.jpg
---

Now, it's pretty clear that we have three different release types:

1. **Development:** where feature work happens and we want  tests to run
2. **Beta:** where the app will distribute to manual testers via HockeyApp
3. **Release:** where the app will distribute to the public via CodePush

We don't want to distribute a beta release every time there's a feature check-in and we sure as hell don't want to release in-development features to the public. To control the build steps executed at check-in, we need a branching strategy. We'll create three new branches at the terminal:

{% highlight PowerShell %}
git checkout -b dev
git commit "create dev branch"
git push

git checkout -b beta
git commit "create beta branch"
git push

git checkout -b release
git commit "create release branch"
git push
{% endhighlight %}

By creating a unique branch for each release type, we gain two big advantages:

1. We can trigger different build steps for each branch. For example, we can release to HockeyApp only when pushing to beta branch.  
2. We can maintain a different set of config files for each branch -- enabling us to use different API keys or service providers for each release type.

Similarly, there are two major changes we need to make to our project:

1. We must change each build definition to trigger based on branch and source the build from the appropriate repository
2. We must create a unique config file for each branch and gulp tasks to move and rename the config file before build

### Creating Unique Configs for Each Branch
In a "normal" local development environment, Cordova build depends on a `config.xml` file in the root directory to define things like icons, splash screens and the App ID. To support different configurations for each branch, I've created a special `/config` folder with config files for each release type (i.e. dev, beta and release). Immediately before Cordova build, we'll use a gulp task to rename the config file and copy it to the root directory. So, for example, gulp beta will:

1. Rename `beta.xml` to `config.xml`
2. Copy the file to the project root

Using this technique, we can use a different deployment key for Code Push or even change the icon to have a "beta" badge when deployed to HockeyApp.

### Configuring VSTS
With a strategy for dynamically changing the app configuration at build time, we can now turn our attention to the VSTS build steps. For each build definition, we will change the trigger branch and source repository to match the branch. We'll also add a Gulp build step to move and rename the config files.

|Build Definition|Source Repository|Trigger Filter|Gulp Build Step|
| --- | --- | --- | --- |
|Android-Dev|Dev|Dev|dev|
|Android-Beta|Beta|Beta|beta|
|Android-Release|Release|Release|release|

### Checking Our Work
You've done all the hard work, now see it work. In Terminal:

{% highlight PowerShell %}
git checkout dev
git touch readme.md
git commit -m "triggering dev CI"
git push

git checkout beta
git merge dev
git push

git checkout release
git merge beta
git push
{% endhighlight %}
