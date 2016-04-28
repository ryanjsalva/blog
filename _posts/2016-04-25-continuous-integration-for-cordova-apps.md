---
layout: post
title:  Continuous Integration for Cordova Apps
excerpt: When you're working on a project with multiple contributors, it helps to know which commit broke the build... and it helps even more to prevent that commit from ever happening. In the first of a four part series, we'll use continuous integration to run unit tests on every commit and build for Android in the cloud.
tags: cordova ionic devops hockeyapp
cover: /assets/2016-04-25-cover.jpg
cover-small: /assets/2016-04-25-cover-small.jpg
---
## Pre-requisites
This tutorial assumes that you've already installed [Node][node], [NPM][npm], [Git][git], [Gulp][gulp], [Cordova][cordova] and [Ionic][ionic]. I also recommend using [VS Code][code] for your code editor, but you can use whatever's comfortable. If you need help setting up your machine, see my previous post, [Configuring the Best Dev Environment for Cordova][devenv]. 

### Get the Sample Project
Start by cloning the sample project into your local directory and restoring all the npm packages

{% highlight PowerShell %}
git clone http://github.com/ryanjsalva/superfly
cd superfly
npm install
{% endhighlight %}

## Create Your Project in VSTS
[Visual Studio Team Services (VSTS)][vsts] provides three basic services:

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

Congratulations! You've setup your dev environment and source control. Celebrate with an awesome song on your headphones. I recommend anything from [Girl Talk's Feed the Animals][girltalk]. 

### Let's Get Unit Tests Running
Like most [Angular][angular] projects, our sample app uses [Karma][karma] and [Jasmine][jasmine] to run unit tests found in the /tests directory. Our sample project includes a Gulp task to invoke these tests. If you're not already familiar with [Gulp][gulp], it's simply a build task manager. Using Gulp, you can create build tasks that move, concatenate, obfuscate, prettify or other wise modify files. You can see it work by opening terminal and executing:

{% highlight PowerShell %}
gulp test
{% endhighlight %}

This task runs our unit tests in a headless browser called [PhantomJS][phantom]. If everything worked correctly, you should see the following response (emphasis mine):

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

When it's all done, you should see a build progress report declaring success. Celebrate with another song in your headphones. I recommend ["I Don't Want to Get Over You" by the Magnetic Fields.][magnetic]



[node]: https://nodejs.org/ 
[npm]: https://www.npmjs.com/
[git]: https://git-scm.com/
[cordova]: https://cordova.apache.org
[ionic]: https://ionicframework.com
[code]: http://code.visualstudio.com
[angular]: https://angularjs.org
[girltalk]: https://soundcloud.com/burtonsnowgod/girl-talk-feed-the-animals-1
[karma]: https://karma-runner.github.io/
[jasmine]: http://jasmine.github.io/
[phantom]: https://phantomjs.org/
[gulp]: https://gulpjs.com
[magnetic]: https://www.youtube.com/watch?v=WVEhNHIzJec