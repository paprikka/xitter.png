const express = require("express");
const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;

app.get("/screenshot/:tweetId", async (req, res) => {
  const apiKey = req.query.api_key;

  // Check if apiKey is provided and matches the environment variable
  if (!apiKey || apiKey !== process.env.API_KEY) {
    return res.status(401).send("Unauthorized: Invalid API Key");
  }

  const tweetId = req.params.tweetId.trim();
  const tweetUrl = `https://platform.twitter.com/embed/Tweet.html?dnt=true&theme=light&id=${tweetId}`;

  console.log("Launch a headless browser");
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  try {
    console.log("Go to the tweet page");
    console.log("tweetUrl: ", tweetUrl);
    await page.goto(tweetUrl, { waitUntil: "networkidle2" });

    console.log(
      "Wait for the tweet to load (we use a selector for the tweet container)"
    );
    await page.waitForSelector("article");

    console.log("Take a screenshot of the tweet");
    const screenshotPath = path.join(__dirname, `tweet_${tweetId}.png`);
    const tweetElement = await page.$("article");
    await tweetElement.screenshot({ path: screenshotPath });

    console.log("Send the screenshot to the client");
    res.sendFile(screenshotPath, () => {
      // Delete the file after sending it
      fs.unlinkSync(screenshotPath);
    });
  } catch (error) {
    res.status(500).send("Error capturing screenshot.");
  } finally {
    await browser.close();
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
