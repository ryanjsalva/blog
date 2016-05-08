---
layout: post
title: Release Without Re-submitting to the App Store
excerpt: Mobile apps created with JavaScript enjoy a unique privilege within app stores. Unlike compiled apps that must be updated through the app store, JavaScript developers can publish bug fixes and feature enhancements by updating web assets over the network. 
tags: cordova ionic devops code-push
cover: /assets/2016-05-01-cover.jpg
cover-small: /assets/2016-05-01-cover-small.jpg
---

**This is part three of a four part series and assumes you've already set-up continuous integration with our [sample project][sample]. If you haven't already, I highly recommend reading part one, [Continuous Integration for Cordova Apps][ci], where we setup the build server used in this tutorial.**

## JavaScript's Unfair Advantage
Mobile apps created with JavaScript (e.g. [Apache Cordova][cordova], [ReactNative][rn]) enjoy a unique privilege within app stores. Unlike compiled apps that developers can only update through the app store, JavaScript apps can download and install updates from any trusted server.  

**Imagine this:** you've just released a major update when... BAM! The one-star reviews start pouring in due to a crashing bug. If you had to re-submit to the app store, you could be waiting days before the store approved and published your new package. By that time, many users will have abandoned your app. The nasty ones might have even written a few flaming store reviews. 🔥 

With over-the-air updates, you can deliver bug fixes directly to your customers by downloading new assets (e.g. HTML, CSS, JS, images) from the cloud and replacing the files packaged with your app. In other words, you can deliver updates immediately and on your own schedule.

## How does it work?
To understand how updates work, it's helpful to get a high-level overview of the workflow:

1. The first time you publish, you submit the __full app__ including both compiled code and web assets to the app store. 

2. When you want to publish an update, you zip up your web assets (no compiled code) and publish them to the Code-Push cloud service. 

3. On some event (e.g. deviceready, resume, button click), each mobile device checks the Code-Push cloud service for an update. 

4. If an update is availabe, each mobile device downloads the update and replaces the contents of **/www** with your new code.

<div style="text-align:center;"><iframe width="560" height="315" src="https://www.youtube.com/embed/nsOR4w2Bpuw?color=white&theme=light&loop=1" frameborder="0" allowfullscreen></iframe></div>

Of course, there are lots of optional detours along this path. For example, you could (1) give users the option to skip an update, (2) update a subset of files in **/www,** or (3) release to only a subset of users. The service itself is very configurable.  
 
### Is Apple really cool with it?
Anytime I speak about bypassing the app store, someone invariably asks if this whole thing is really kosher with the app stores. The answer is, "Yes! Yes! A thousand times, yes!" In fact, it's written into Apple's developer agreement (emphasis mine). The same goes for Android.

![Sample Apple Developer Agreement](/assets/2016-05-01-agreement.jpg)

### Service Providers
There are a number of plugins & services that make over-the-air updates possible. Cordova developers can choose between [PhoneGap Hydration][hydrate], [Ionic Deploy][deploy] and [Code Push][codepush]. Code Push also happens to be the defacto choice for most ReactNative developers, so our example will use it. 

## Let's code (push)
Again, Our tutorial will use the [superfly sample project][sample] and Visual Studio Team Services (VSTS) setup in [part one of this series.][ci] 

Like other device capabilities, Code Push has it's own Cordova plugin [(cordova-plugin-code-push)][plugin] which has already been added to our sample project. You can see the reference in config.xml:

{% highlight html %}
<plugin name="cordova-plugin-code-push" spec="~1.6.0-beta" />
{% endhighlight %}

### Create Your Code-Push Service
To register for the Code Push service, you must first install the Code Push CLI. From your terminal...

{% highlight PowerShell %}
# install code-push globally
npm install -g code-push-cli

# sign up for the free code-push service
code-push register
{% endhighlight %}

This second command will open a browser where you should simply follow the registration process. As usual, it's free to use, so don't worry about pulling out the credit card. 💸

### Managing Deployments
Once you've registered, go back to the command line where we'll register our first app with the Code Push service.

{% highlight PowerShell %}
code-push app add superfly
{% endhighlight %}

Code Push will return two deployment keys: Staging and Production. These keys are used to identify your app when making a request to the Code Push service and will be saved in **config.xml.** If you lose the key, don't worry. You can retrieve it at any time by executing:

{% highlight PowerShell %}
code-push deployment list superfly -k
{% endhighlight %}

Under most circumstances, you'll want to deploy to iOS and Android separately. After all, if a bug fix is unique to Android, we don't want to inconvenience iOS users with an unnecessary update. So, let's prepare for the future by creating separate deployment keys for iOS and Android.

{% highlight PowerShell %}
# rename the default Staging key for Android
code-push deployment rename superfly Staging Staging-Android

# rename the default Production key for Android
code-push deployment rename superfly Production Production-Android

# create a new Staging key for iOS
code-push deployment add superfly Staging-iOS

# create a new Production key for iOS
code-push deployment add superfly Production-iOS

# make sure we got it right
code-push deployment list superfly -k
{% endhighlight %}

### Add the Deployment Key to Your App
You've created deployment keys for each platform. Now, it's time to save those deployment keys with your app. Open **config.xml** in the superfly project and insert the Staging-Android and Staging-iOS deployment keys where indicated:

{% highlight HTML %}
<platform name="android">
    <preference name="CodePushDeploymentKey" value="YOUR-ANDROID-DEPLOYMENT-KEY" />
</platform>
<platform name="ios">
    <preference name="CodePushDeploymentKey" value="YOUR-IOS-DEPLOYMENT-KEY" />
</platform>
{% endhighlight %}

Notice that we're hard-coding the deployment keys in config.xml. In part four of this series, I'll show you how to dynamically change keys based on your deployment target (e.g. Staging or Production).
{: .pull-quote } 

### Safety first!
Any Cordova app using version 5 or greater is required to use the [whitelist plugin][whitelist] and declare a [Content Security Policy (CSP)][csp]. The CSP essentially answers the question, "what domains are trusted to provide data?" To establish trust with the Code Push server, we need to add the following meta tag to **index.html:**

{% highlight HTML %}
<meta http-equiv="Content-Security-Policy" content="script-src https://codepush.azurewebsites.net http://localhost:* 'self' 'unsafe-inline' 'unsafe-eval'; media-src *">   
{% endhighlight %}

Translated into English this CSP says, "It's okay to execute JavaScript from..."

 👍 [https://codepush.azurewebsites.net](https://codepush.azurewebsites.net)<br />
 👍 [http://localhost](http://localhost)<br />
 👍 Any file referenced in root directory<br />
 👍 Inline `<script>` tags<br />
 👍 `eval()` statements are also OK<br />
 👍 Images, videos and other media can come from anywhere

### Invoke the Code-Push API
We've already established our app's identity by created deployment keys. Now, we need to tell the app how and when to ping the Code Push service for an update. For demonstration purposes we're simply going to check for updates when clicking a menu item, but you may want to use app lifecycle events like `deviceready.` Our button can be found in **/www/templates/menu.html**. 

{% highlight HTML %}
<!-- Code Push -->
<a class="item item-icon-left" ng-click="codePush()">
    <i class="icon ion-ios-cloud-download-outline"></i>Check Update
</a>
{% endhighlight %}

... and the handler in **/www/js/controllers.js** 

{% highlight JavaScript %}
/* ---------------------------------------------------------------
   codepush check for update */
$scope.codePush = function() {
    console.log('check for code push update');
    
    var updateDialogOptions = {
        updateTitle: "Update",
        mandatoryUpdateMessage: "You will be updated to the latest version of the app.",
        mandatoryContinueButtonLabel: "Continue",
        optionalUpdateMessage: "Update available. Install?",
        optionalIgnoreButtonLabel: "No",
        optionalInstallButtonLabel: "Yes",
    };

    var syncOptions = {
        installMode: InstallMode.ON_NEXT_RESTART,
        updateDialog: updateDialogOptions
    };
    
    var syncStatusCallback = function (syncStatus) {
        switch (syncStatus) {
            // Result (final) statuses
            case SyncStatus.UPDATE_INSTALLED:
                $ionicPopup.alert({
                    title: "Sweet Success",
                    template: "Restart your app to complete the update."
                });
                break;
            case SyncStatus.UP_TO_DATE:
                $ionicPopup.alert({
                    title: "All Good",
                    template: "Your application is up to date."
                });
                break;
            case SyncStatus.UPDATE_IGNORED:
                console.log("The user decided not to install the optional update.");
                break;
            case SyncStatus.ERROR:
                $ionicPopup.alert({
                    title: "@#$!",
                    template: "Something went wrong. Try restarting your app."
                });
                break;

            // Intermediate (non final) statuses
            case SyncStatus.CHECKING_FOR_UPDATE:
                console.log("Checking for update.");
                break;
            case SyncStatus.AWAITING_USER_ACTION:
                console.log("Alerting user.");
                break;
            case SyncStatus.DOWNLOADING_PACKAGE:
                console.log("Downloading package.");
                break;
            case SyncStatus.INSTALLING_UPDATE:
                console.log("Installing update");
                break;
        }
    };

    window.codePush.sync(syncStatusCallback, syncOptions);
}
// --------------------------------------------------------------- */
{% endhighlight %}

While this looks complicated, it's really quite simple once you break it down. 

1. `updateDialogOptions {...}` provides optional text and styling information
2. `syncOptions {...}` tells Code Push to replace the content of **/www** on restart  
3. `syncStatusCallback` handles the range of possible responses from the Code-Push service
4. `window.codePush.sync(...)` invokes the actual codePush API

The truth is that you could omit items 1-3 and just let Code Push do everything with `window.codePush.sync()`, but it's nice to see what's possible with a fully customized implementation.

## Automate Deployments with VSTS
Similar to the steps followed in [part two of this series][parttwo], we're going to clone our pre-existing build definition and add a Code Push build step. Login to VSTS and navigate to the BUILD tab. Right-click on the "Android-Build" definition and select Clone.

![Clone build definition](/assets/2016-05-01-clone-build-definition.png)

With the new build definition selected, click "Add build step" and choose "Code Push - Release" from the Deploy category.

![Add build step: Code Push - Release](/assets/2016-05-01-add-build-step.png)

### Configure Your Code Push Build Step
Once you've added the build step, you'll need to configure it as pictured below:

![Configure Code Push build step](/assets/2016-05-01-configure-build-step.png)

|Label|Value|Why?|
| --- | --- | --- |
|Authentication Method|Access Key|Establishes trust with the Code Push cloud service|
|Access Key|$(code-push-access-key)|To protect our access key, we'll encrypt it in a variable|
|App Name|superfly|This is human readable app name published to the store|
|Deployment|Staging|We'll use staging while testing|
|Update Contents Path|platforms/android/assets/www|Default location where Cordova outputs the web assets for Android|
|Target Binary Version|^0.0.2|[Semantic Versioning.][semver] This says, "install the update if you're installed app is of version 0.0.2+n"|
|Rollout|100%|Deploy this update to 100% of possible users|
|Descrition| |You can display this message to users before an update|
|Mandatory|Unchecked|Don't require this update|
|Disabled|Unchecked|We want to run this build step|
|Enabled|Checked|We want to run this build step|
|Continue on error|Unchecked|Stop the presses when there's a build error|
|Always run|Unchecked|Since we never continue on error, it's okay to leave this unchecked|
{: .small }
 
### Establish Trust Between VSTS and Code Push
As you probably noticed above, we referenced a VSTS build variable to store `$(code-push-access-key)`, but haven't actually created one yet. Remember, the Access Key establishes a bond of trust between VSTS and the Code Push service so that VSTS can deploy on your behalf. To get your Access Key, go to the command line and execute:

{% highlight PowerShell %}
# create the access key
code-push access-key add superfly
{% endhighlight %}

This command will return a 32 character key. Back in VSTS, go to the **Variables** tab and add a variable named "code-push-access-key" using your new key. To protect it from prying eyes, select the lock icon to the right of the input box.

![Add the code-push-access-key variable](/assets/2016-05-01-add-variable.png)

### Deploy on Commit
At last, we're ready to commit our code changes and use Code Push to deploy our update over-the-air. Make sure  "Continuous Integration" is checked under the Triggers tab and save this build definition as "Android-Release." 

![Triggers set to use Continuous Integration](/assets/2016-05-01-triggers.png)

With "Continuous Integration" checked, this build definition will run every time someone commits code to the master branch. To trigger the next build, open your terminal and push the latest changes...

{% highlight PowerShell %}
git commit -m "Add code push"
git push
{% endhighlight %}

Once the files have transferred, you should be able to see your build complete in VSTS. Select "Android-Release" then double-click on the build number under "Queued Builds". 

![Android-Release build executing](/assets/2016-05-01-queued-build.png)

## Open the App and Check for Updates
To see Code Push in action, deploy the app to a local device or emulator. I'm using a Nexus 5 running Android Marshmallow (because I'm fresh like that). From your terminal...

{% highlight PowerShell %}
cd ~/Code/superfly
cordova run android --device
{% endhighlight %}

From the running app, open the slide-in menu and select "Code Push Update"

![App running on Android](/assets/2016-05-01-app.png)
{: .android-device }

TA-DA! Your app will update on restart. 

## Mobile DevOps: A Four Part Series

* [Part One: Continuous Integration for Cordova Apps][pi]
* [Part Two: Beta Testing with HockeyApp][pii]
* [Part Three: Publish without Resubmitting to the App Store][piii]
* [Part Four: Maintaining Different Release Configurations][piv]

[ci]: /2016/04/25/continuous-integration-for-cordova-apps.html 
[sample]: http://github.com/ryanjsalva/superfly
[cordova]: http://cordova.apache.org
[rn]: https://facebook.github.io/react-native/
[deploy]: http://ionic.io/#major-feature-deploy
[hydrate]: http://docs.build.phonegap.com/en_US/tools_hydration.md.html
[codepush]: http://codepush.tools
[plugin]: https://www.npmjs.com/package/cordova-plugin-code-push
[whitelist]: https://github.com/apache/cordova-plugin-whitelist
[csp]: http://taco.visualstudio.com/en-us/docs/cordova-security-whitlists/
[docs]: https://microsoft.github.io/code-push/docs/getting-started.html
[parttwo]: /2016/04/26/beta-testing-with-hockeyapp.html
[semver]: http://semver.org/
[pi]: /2016/04/25/continuous-integration-for-cordova-apps.html
[pii]: /2016/04/26/beta-testing-with-hockeyapp.html
[piii]: /2016/05/01/publish-without-resubmitting-to-the-app-store.html
[piv]: /2016/05/07/maintaining-different-release-configurations.html
