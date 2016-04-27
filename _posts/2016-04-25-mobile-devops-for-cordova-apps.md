---
layout: post
title:  Continuous Integration and Deployment for Cordova Apps
excerpt: this is the excerpt
tags: cordova ionic devops hockeyapp
cover: /assets/2016-04-25-cover.jpg
cover-small: /assets/2016-04-25-cover-small.jpg
---
## Pre-requisites
This tutorial assumes that you've already installed [Node](node), [NPM](npm), [Git](git), [Gulp](gulp), [Cordova](cordova) and [Ionic](ionic). I also recommend using [VS Code](code) for your code editor, but you can use whatever's comfortable. If you need help setting up your machine, see my previous post, [Configuring the Best Dev Environment for Cordova](devenv). 

### Get the Sample Project
Start by cloning the sample project into your local directory and restoring all the npm packages

{% highlight PowerShell %}
git clone http://github.com/ryanjsalva/superfly
cd superfly
npm install
{% endhighlight %}

## Create Your Project in VSTS
[Visual Studio Team Services (VSTS)](vsts) provides three basic services:

1. Git-based source control
2. Cross-platform build automation
3. Agile team management (e.g. scrum boards, backlogs, bug tracking)

In a lot of ways, you can think of it as the union between GitHub, Atlassian and Jenkins (if you're familiar with those). By combining all three services in the same tool, we can automate a lot of the grunt work. As of this writing, it's free for teams of 6 or less. (Side note: it almost criminal that you can get a pre-configured automated build environment for free these days. What a time to be alive!) 

Once you've logged in, you'll see this page:

![VSTS New Project](/assets/2016-04-25-vsts-new-project.png)

Create a new project and name it `superfly`. On the next screen, choose to start by "adding code." VSTS will provide you with a git URI that you can run in the terminal. Now we just need to push our first commit to VSTS. 

{% highlight PowerShell %}
git remote add origin https://ryanjsalva.visualstudio.com/DefaultCollection/_git/superfly
git commit -m "first commit"
git push
{% endhighlight %}

Congratulations! You've setup your dev environment and source control. Celebrate with an awesome song on your headphones. I recommend anything from [Girl Talk's Feed the Animals](girltalk). 

### Let's Get Unit Tests Running
Like most [Angular](angular) projects, our sample app uses [Karma](karma) and [Jasmine](jasmine) to run unit tests found in the /tests directory. Our sample project includes a Gulp task to invoke these tests. If you're not already familiar with [Gulp](gulp), it's simply a build task manager. Using Gulp, you can create build tasks that move, concatenate, obfuscate, prettify or other wise modify files. You can see it work by opening terminal and executing:

{% highlight PowerShell %}
gulp test
{% endhighlight %}

This task runs our unit tests in a headless browser called [PhantomJS](phantom). If everything worked correctly, you should see the following response (emphasis mine):

{% highlight PowerShell %}
Using gulpfile ~/Desktop/superfly/gulpfile.js
Starting 'test'...
22 04 2016 21:38:37.271:INFO karma: Karma v0.13.22 server started at http://localhost:9876/
22 04 2016 21:38:37.277:INFO launcher: Starting browser PhantomJS
22 04 2016 21:38:38.398:INFO PhantomJS 1.9.8 (Mac OS X 0.0.0): Connected on socket /#WzMqeZ4EfOqhVS27AAAA with id 41819505
PhantomJS 1.9.8 (Mac OS X 0.0.0): Executed 2 of 2 SUCCESS (0.007 secs / 0.012 secs)
Finished 'test' after 1.4 s
{% endhighlight %}

### Run Tests on Every Push
Now that we have tests running locally manually, we want to run them in the cloud automatically. Head back to VSTS and click on the "BUILD" tab at the top. From here, we'll create our first build definition by clicking the [+] icon.

![VSTS Empty list of build defitions](/assets/2016-04-25-build-definition-empty.png)

Name your build definition "Android-Build", choose the **Empty** template and select the **Continuous Integration** checkbox since we want builds to run on every push. Otherwise, stick with the defaults.

![VSTS New Build Definition](/assets/2016-04-25-build-definition-new.png)

Each build definition is comprised of multiple build steps executed in serial order. Let's add some. Click **Add build step** and add the following steps in this order:

1. **npm:** to download all the node_modules not saved in our repository
2. **Gulp:** to run our "test" task
3. **Cordova Build:** to build the app

For the most part, you should be able to go with all the defaults. To configure each build step, select it and set the following values:

![VSTS Build Step: npm](/assets/2016-04-25-build-step-npm.png)
![VSTS Build Step: gulp](/assets/2016-04-25-build-step-gulp.png)
![VSTS Build Step: Cordova Build](/assets/2016-04-25-build-step-cordova.png)

Under the Cordova Build step, notice the `$(configuration)` variable. This allows to dynamically change the build configuration (e.g. debug or release) at queue time, but it requires a little extra setup. Switch to the **Variables** tab and add a new variable for "configuration" before clicking **SAVE**.

![VSTS Build Definition: Variables](/assets/2016-04-25-build-definition-variables.png)

Since we're here, we might as well take a look at some of the other interesting fields, though no changes will be required. Under the **Triggers** tab, we see that new builds will be triggered every time there's a push to the master branch.

![VSTS Build Definition: Triggers](/assets/2016-04-25-build-definition-triggers.png)

Under the **Repository** tab, we see that new builds will also use source from the master branch.

![VSTS Build Definition: Repository](/assets/2016-04-25-build-definition-repository.png)

If you haven't already, click **SAVE** so that we can trigger our first CI build. Go back to terminal, and commit a change:

{% highlight PowerShell %}
touch readme.md
git commit -m "created empty readme"
git push
{% endhighlight %}

You can see your build spool by clicking **Builds**, then navigating to the **Queued** tab and double-clicking the queued build.

When it's all done, you should see a build progress report declaring success. Celebrate with another song in your headphones. I recommend ["I Don't Want to Get Over You" by the Magnetic Fields.](magnetic)

## Using HockeyApp for Beta Testing
While unit tests and end-to-end tests provide a great sanity check before pushing code into source control, the best bugs are often discovered through manual testing. Real human users just have a better sense for when something isn't "right." For beta testing, I'm a big fan of [HockeyApp](hockey). Without the sales pitch, here's what HockeyApp enables:

- Distribution to a controlled group of iOS, OSX, Android, Windows users
- Detailed crash reporting and analytics
- User feedback (e.g. send messages, attach screenshots, threaded communication)
- App version control
- Integration with the most popular bug tracking systems

While HockeyApp allows you to manually upload app packages through their website, we want to automate releases through our build server on VSTS. Start by creating a free trial account on http://www.hockeyapp.net. 

Once you've created an account, we need to establish trust with VSTS by sharing an App Key. Go to **Account Settings** within the HockeyApp portal and select **API Tokens** in the sidebar. From here, create an "All Apps" token with **Full Access** rights. HockeyApp will generate a 32-character token.

Within VSTS, right-click on the **Android-Build** definition that you previously created and select **Clone.** After all, there's no need to start from scratch again. Add the **HockeyApp** build step after Cordova Build and configure it as pictured below.

To get the **HockeyApp Connection**, you'll need to take one extra step. Click **Manage**. In the new window, select **HockeyApp**, then enter the 32-character token you created in HockeyApp. When you return to VSTS, simply click the refresh button adjacent to the drop-down to make your new connection appear. 

Now, you're ready to automate your next build with another commit. Save this build definition as **Android-Beta**. Go back to Terminal and run:

{% highlight PowerShell %}
touch readme.md
git commit -m "testing build automation"
git push
{% endhighlight %}

When you return to VSTS, you should find a build in the queue for **Android-Beta.** 

While that's building, grab your Android phone and install HockeyApp. HockeyApp is also available for iOS and Windows, but we're only building for Android right now... so, hopefully, you've got an Android phone handy :-)

After authenticating -- and assuming the beta build has completed -- you should see an app appear in your HockeyApp mobile client. Install and open it. You'll find at least two fun features to try in the sample app sidebar menu:

1. **Fake Crash** will force the mobile app to crash so you have a chance to explore HockeyApp's crash analytics
2. **Send Feedback** allows beta testers to submit feedback to the development team directly through the app. Don't forget to try attaching a picture (e.g. a screenshot) where you can annotate with crude finger drawings.

Once you've had a chance to play with the app and forced a few crashes, go back to the HockeyApp portal. With a few minutes of exploring, you'll find lots of neat features. 

## Publish Bug Fixes Without Resubmitting to the App Store
Mobile apps created with JavaScript (e.g. Apache Cordova, ReactNative) enjoy a unique privilege in the app stores. Unlike compiled apps that must be updated through the app store, JS apps can developers can deliver bug fixes and feature enhancements via [CodePush](codepush).

### Maintaining Different Release Configurations
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


[node]: https://nodejs.org/ 
[npm]: https://www.npmjs.com/
[git]: https://git-scm.com/
[cordova]: https://cordova.apache.org
[ionic]: https://ionicframework.com
[angular]: https://angularjs.org
[girltalk]: https://soundcloud.com/burtonsnowgod/girl-talk-feed-the-animals-1
[karma]: https://karma-runner.github.io/
[jasmine]: http://jasmine.github.io/
[phantom]: https://phantomjs.org/
[hockey]: https://hockeyapp.net
[codepush]: http://codepush.tools
[gulp]: https://gulpjs.com
[magnetic]: https://www.youtube.com/watch?v=WVEhNHIzJec