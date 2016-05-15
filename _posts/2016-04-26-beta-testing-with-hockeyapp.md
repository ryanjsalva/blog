---
layout: post
title:  Beta Testing with HockeyApp
excerpt: Today, we'll learn how to distribute our app to beta testers, collect crash analytics and collect user feedback through an in-app form. Part 2 of a 4 part series.
tags: cordova ionic devops hockeyapp
cover: /assets/2016-04-26-cover.jpg
cover-small: /assets/2016-04-26-cover-small.jpg
---

**This is part two of a four part series and assumes you've already set-up continuous integration with our [sample project][sample]. If you haven't already, I highly recommend reading [Continuous Integration for Cordova Apps.][ci]**

Unit tests and end-to-end tests provide a great sanity check before pushing code into source control, but the best bugs are often discovered through manual testing. Real human users just have a better sense for when something isn't "right." 

For beta testing, I prefer [HockeyApp][hockey] over [Apple TestFlight][testflight] or the [Google beta program][googlebeta] because it allows me to distribute to **unlimited beta testers, collect crash analytics and user feedback.** 

With HockeyApp, I can:

- Upload my apps manually through the website or through a CI system
- Distribute to a controlled group of iOS, Android and Windows users
- Collect detailed crash reporting and analytics
- Collect user feedback (e.g. send messages, attach screenshots, threaded communication)
- Control the app version installed on user devices
- Integrate with most popular bug tracking systems

HockeyApp is also free for accounts with up to 2 apps, so it's a no-brainer to try. 

### Get Started

While HockeyApp allows you to manually upload app packages through their website, we want to automate releases through our build server on VSTS. So, let's start by creating a free account on [http://www.hockeyapp.net][hockey]. 

![Signup for a HockeyApp account](/assets/2016-04-26-signup.png)

Once you've created an account, we need to establish trust with VSTS by sharing an API Token. Go to **Account Settings** within the HockeyApp portal and select **API Tokens** in the sidebar. From here, create an "All Apps" token with "Full Access" rights. HockeyApp will generate a 32-character token. You're going to use that token in a minute, but just keep the tab open for now. 

![Create an API token](/assets/2016-04-26-create-token.png)

Switch to a new browser tab and open the **Build** tab of your VSTS account. Right-click on the **Android-Build** definition that you previously created and select **Clone.** After all, there's no need to start from scratch again. In the cloned build definition, add the **HockeyApp** build step after "Cordova Build".

![Add Hockey App Build Step](/assets/2016-04-26-add-build-step.png)

To get the **HockeyApp Connection**, you'll need to take one extra step. Click **Manage** adjacent to the input box. In the new window, select **HockeyApp**, then enter the 32-character token you created in HockeyApp. 

![Add Service Endpoint for HockeyApp](/assets/2016-04-26-service-endpoint.png)

When you return to VSTS, simply click the refresh button adjacent to the drop-down to make your new connection appear. Configure your build step as pictured below:

![Configure your HockeyApp build step](/assets/2016-04-26-hockeyapp-build-step.png)

|Label|Value|Why?|
| --- | --- | --- |
|HockeyApp Connection|All Apps|Points to the API token you created in HockeyApp and establishes trust|
|App ID|com.ryanjsalva.superfly|This is the default App ID of my sample project. You can find/change it by looking for the `<widget>` tag in config.xml|
|Binary File Path|platforms/android/build/outputs/apk/android-debug.apk|Default location where Cordova outputs the native app package|
|Symbols File Path| |Not used by our project|
|Native Library File Path| |Not used by our project|
|Release Notes (File)| |Not used by our project|
|Release Notes|Recommended update.|Because if we say it's "recommended", surely they'll install it, right?|
|Publish|Checked|Immediately publishes to HockeyApp|
|Mandatory|Unchecked|Not a required update|
|Notify Users?|Checked|Users are more likely to install if you tell them something is available|
|Tags| |No tags mean the update goes to everyone|
|Teams| |No teams mean the update goes to everyone|
|Users| |No users mean the udpate goes to everyone|
|Enabled|Checked|We want to run this build step|
|Continue on error|Unchecked|Stop the presses when there's a build error|
|Always run|Unchecked|Since we never continue on error, it's okay to leave this unchecked|
{: .small}

Save this build definition as **Android-Beta**. We won't build yet because there are still a few code changes necessesary, but celebrate anyway with a song in your headphones. I recommend [The Modern Lovers' Girlfriend][girlfriend].

### Invoke HockeyApp from Code

The HockeyApp SDK is delivered as a [Cordova plugin][plugin]. That plugin is already installed in our [sample project][sample] (you're welcome), but we need to invoke it. Fortunately, that only requires modifying a few lines. In **/www/js/app.js**, uncomment the following line and replace "APP_ID" with the value for `<widget id="APP_ID">` found in **config.xml.** Assuming you don't create your own APP_ID, the value will be "com.ryanjsalva.superfly".

{% highlight JavaScript %}
hockeyapp.start(null, null, "APP_ID");
 {% endhighlight %}

Note that the APP_ID needs to match in three places:

| Location | Value | Why? |
| --- | --- | --- |
| /config.xml | `<widget id="APP_ID">` | Authoritative source for APP_ID |
| /www/js/app.js | `hockeyapp.start(null,null,"APP_ID")` | Establishes app identity when calling into the HockeyApp API |
| VSTS | HockeyApp build step configuration | I honestly don't know |
{: .small }

Next, we need to uncomment a few lines from **/www/js/controllers.js**

{% highlight JavaScript %}
$scope.fakeCrash = function() {
    console.log('fake crash');
    hockeyapp.addMetaData(null, null, { someCustomProp: 23, anotherProp: "Custom Value" });
    hockeyapp.forceCrash();
}

// hockeyapp send feedback
$scope.sendFeedback = function() {
    console.log('send feedback');
    hockeyapp.feedback();
}

// hockeyapp check for update
$scope.checkForUpdate = function() {
    console.log('check for HockeyApp update');
    hockeyapp.trackEvent(null, null, 'Check for Update');
    hockeyapp.checkForUpdate();
}
{% endhighlight %}

These methods will be invoked when we click the corresponding menu items in our app's menu bar. As you can see, there's not much to them. The one thing I'd call out is `hockeyapp.addMetaData([json])`. You can invoke this method at any time to record _n_ parameters describing your runtime state. This can be tremendously helpful if you need help debugging you app in the wild. 

### Run that build, you crazy kid

Now, you're ready to automate your next build with another commit. Go back to Terminal and run:

{% highlight PowerShell %}
git commit -m "enabled hockeyapp"
git push
{% endhighlight %}

When you return to VSTS, you should find a build in the queue for **Android-Beta.** 

## Install HockeyApp on your Android Device 

While that's building, grab your Android phone and install [HockeyApp][download]. HockeyApp is also available for iOS and Windows, but this tutorial only builds for Android... so, hopefully, you've got an Android phone handy 😛

After authenticating on your Android device -- and assuming the beta build has completed -- you should see an app appear in your HockeyApp mobile client. Install and open it. You'll find at least two fun features to try in the sample app sidebar menu:

1. **Fake Crash** will force the mobile app to crash so you have a chance to explore HockeyApp's crash analytics
2. **Send Feedback** allows beta testers to submit feedback to the development team directly through the app. Don't forget to try attaching a picture (e.g. a screenshot) where you can annotate with crude finger drawings.

Once you've had a chance to play with the app and forced a few crashes, go back to the HockeyApp portal. With a few minutes of exploring, you'll find lots of neat features. Listen to a song in your headphones while exploring, I recommend ["March of the Nucleotides by Bit Shifter."][bitshifter]

## Mobile DevOps: A Four Part Series

* [Part One: Continuous Integration for Cordova Apps][pi]
* [Part Two: Beta Testing with HockeyApp][pii]
* [Part Three: Publish without Resubmitting to the App Store][piii]
* [Part Four: Maintaining Different Release Configurations][piv]

[ci]: /2016/04/25/continuous-integration-for-cordova-apps.html 
[sample]: http://github.com/ryanjsalva/superfly
[plugin]: https://github.com/bitstadium/HockeySDK-Cordova
[download]: https://www.hockeyapp.net/apps/
[girlfriend]: https://www.youtube.com/watch?v=veNzHk-ZNEs
[testflight]: https://developer.apple.com/testflight/
[googlebeta]: http://developer.android.com/distribute/engage/beta.html
[hockey]: https://hockeyapp.net
[codepush]: http://codepush.tools
[bitshifter]: https://soundcloud.com/bit-shifter/march-of-the-nucleotides-mrna
[pi]: /2016/04/25/continuous-integration-for-cordova-apps.html
[pii]: /2016/04/26/beta-testing-with-hockeyapp.html
[piii]: /2016/05/01/publish-without-resubmitting-to-the-app-store.html
[piv]: /2016/05/07/maintaining-different-release-configurations.html
