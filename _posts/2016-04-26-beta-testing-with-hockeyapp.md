---
layout: post
title:  Beta Testing with HockeyApp
excerpt: Today, we'll learn how to distribute our app to beta testers, collect crash analytics and collect user feedback through an in-app form. Part 2 of a 4 part series.
tags: cordova ionic devops hockeyapp
cover: /assets/2016-04-26-cover.jpg
cover-small: /assets/2016-04-26-cover-small.jpg
---

This is part two of a four part series and assumes you've already set-up continuous integration. If you haven't already, I highly recommend reading [Continuous Integration for Cordova Apps.][ci]

While unit tests and end-to-end tests provide a great sanity check before pushing code into source control, the best bugs are often discovered through manual testing. Real human users just have a better sense for when something isn't "right." For beta testing, I'm a big fan of [HockeyApp][hockey]. Without the sales pitch, here's what HockeyApp enables:

- Distribution to a controlled group of iOS, OSX, Android, Windows users
- Detailed crash reporting and analytics
- User feedback (e.g. send messages, attach screenshots, threaded communication)
- App version control
- Integration with the most popular bug tracking systems

While HockeyApp allows you to manually upload app packages through their website, we want to automate releases through our build server on VSTS. Start by creating a free trial account on [http://www.hockeyapp.net][hockey]. 

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


[ci]: /2016/04/25/continuous-integration-for-cordova-apps.html 
[hockey]: https://hockeyapp.net
[codepush]: http://codepush.tools
