// ----------------------------------------------------------------------------------//
// TWEETR
// Tumblr posting bot (( BETA v0.1.0 ))
// Fiigmnt | Febuary 9, 2022 | Updated:
// ----------------------------------------------------------------------------------//

import { Client as Notion } from "@notionhq/client";
import { TwitterApi } from "twitter-api-v2";
import fetch from "node-fetch";
import dotenv from "dotenv";

import fs from "fs";
import https from "https";

dotenv.config();

const {
  NOTION_TOKEN,
  NOTION_DB: databaseId,
  TWITTER_APP_KEY,
  TWITTER_APP_SECRET,
  TWITTER_ACCESS_TOKEN,
  TWITTER_ACCESS_SECRET,
  TUMBLR_TOKEN,
} = process.env;

const notion = new Notion({
  auth: NOTION_TOKEN,
});

// OAuth 1.0a (User context)
const twitterClient = new TwitterApi({
  appKey: TWITTER_APP_KEY || "",
  appSecret: TWITTER_APP_SECRET || "",
  accessToken: TWITTER_ACCESS_TOKEN || "",
  accessSecret: TWITTER_ACCESS_SECRET || "",
});

const rand = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min)) + min;
};

const checkNotionId = async (rowId: string): Promise<boolean | undefined> => {
  if (!databaseId) {
    console.log("No Database Connection!");
    return;
  }
  try {
    const response = await notion.databases.query({
      database_id: databaseId,
      filter: {
        property: "id",
        title: {
          equals: rowId,
        },
      },
    });
    return response.results.length > 0;
  } catch (error) {
    console.error(`Notion Error: ${error}`);
  }
};

const addPostToNotion = async (tweet: Tweet) => {
  if (!databaseId) {
    console.log("No Database Connection!");
    return;
  }
  try {
    await notion.pages.create({
      parent: { database_id: databaseId },
      properties: {
        id: {
          title: [
            {
              text: {
                content: tweet.id,
              },
            },
          ],
        },
        "media-id": {
          rich_text: [
            {
              text: {
                content: tweet.mediaId,
              },
            },
          ],
        },
        url: {
          url: tweet.url,
        },
        date: {
          date: {
            start: new Date().toISOString(),
          },
        },
      },
    });
    console.log(`---------- ENTRY ADDED -----------`);
  } catch (error) {
    console.error(error);
  }
};

const getRequestString = (pageNumber = null) => {
  if (pageNumber) {
    return `https://api.tumblr.com/v2/blog/0xmirage/posts?fields%5Bblogs%5D=name%2Cavatar%2Ctitle%2Curl%2Cis_adult%2C%3Fis_member%2Cdescription_npf%2Cuuid%2Ccan_be_followed%2C%3Ffollowed%2C%3Fadvertiser_name%2Ctheme%2C%3Fprimary%2C%3Fis_paywall_on%2C%3Fpaywall_access%2C%3Fsubscription_plan%2Cshare_likes%2Cshare_following%2Ccan_subscribe%2Csubscribed%2Cask%2C%3Fcan_submit%2C%3Fis_blocked_from_primary%2C%3Fis_blogless_advertiser%2C%3Ftweet%2Cupdated%2Cfirst_post_timestamp%2Cposts%2Cdescription%2C%3Ftop_tags_all&npf=true&reblog_info=true&tumblelog=0xmirage&page_number=${pageNumber}`;
  }
  return "https://api.tumblr.com/v2/blog/0xmirage/posts?fields%5Bblogs%5D=name%2Cavatar%2Ctitle%2Curl%2Cis_adult%2C%3Fis_member%2Cdescription_npf%2Cuuid%2Ccan_be_followed%2C%3Ffollowed%2C%3Fadvertiser_name%2Ctheme%2C%3Fprimary%2C%3Fis_paywall_on%2C%3Fpaywall_access%2C%3Fsubscription_plan%2Cshare_likes%2Cshare_following%2Ccan_subscribe%2Csubscribed%2Cask%2C%3Fcan_submit%2C%3Fis_blocked_from_primary%2C%3Fis_blogless_advertiser%2C%3Ftweet%2Cupdated%2Cfirst_post_timestamp%2Cposts%2Cdescription%2C%3Ftop_tags_all&npf=true&reblog_info=true";
};

const fetchTumblrPosts = async (pageNumber = null) => {
  return (
    await (
      await fetch(getRequestString(pageNumber), {
        headers: {
          accept: "application/json;format=camelcase",
          "accept-language": "en-us",
          authorization: `Bearer ${TUMBLR_TOKEN}`,
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site",
          "sec-gpc": "1",
          "x-ad-blocker-enabled": "1",
          "x-is-blog-network": "1",
          "x-version": "redpop/3/0//redpop/",
          cookie: "tmgioct=62044394f2e9270993792200",
          Referer: "https://0xmirage.tumblr.com/",
          "Referrer-Policy": "strict-origin-when-cross-origin",
        },
        method: "GET",
      })
    ).json()
  ).response;
};

const getAllTumblrPosts = async () => {
  const initialResult = await fetchTumblrPosts();
  let posts = initialResult.posts;
  let pageNumber = initialResult.links?.next?.queryParams?.pageNumber;
  for (let i = 0; i < 5; i++) {
    if (pageNumber) {
      const nextResult = await fetchTumblrPosts(pageNumber);
      pageNumber = nextResult.links?.next?.queryParams?.pageNumber;
      posts = posts.concat(nextResult.posts);
      i = 0;
    }
  }
  let media: { id: string; type: string; url: any }[] = [];
  for (const post of posts) {
    const content = post?.trail[0]?.content;
    if (content) {
      for (let i = 0; i < content.length; i++) {
        if (content[i].type === "image") {
          const url = content[i].media[0].url;
          media.push({
            id: getIdFromUrl(url),
            type: getTypeFromUrl(url),
            url,
          });
        }
      }
    }
  }
  return media;
};

const findUniquePost = async (posts: Post[]): Promise<Post> => {
  let postFound: boolean | undefined = true;
  let post: Post = posts[rand(0, posts.length - 1)];

  while (postFound) {
    postFound = await checkNotionId(post.id);
    post = posts[rand(0, posts.length - 1)];
  }

  return post;
};

const getIdFromUrl = (url: string) => {
  return url
    .substring(url.indexOf("com/") + 4)
    .substring(0, url.substring(url.indexOf("com/") + 4).indexOf("/"));
};

const getTypeFromUrl = (url: string) => {
  return url
    .substring(url.indexOf("com/") + 4)
    .substring(url.substring(url.indexOf("com/") + 4).indexOf(".") + 1);
};

type Post = {
  id: string;
  type: string;
  url: string;
};

const downloadFile = async (post: Post) => {
  // URL of the image
  const url = post.url;
  const fileName = `${post.id}.${post.type}`;
  const path = `${__dirname}/../files/${fileName}`;

  try {
    const filePath = await new Promise((resolve, reject) => {
      https.get(url, (res) => {
        // Image will be stored at this path
        const filePath = fs.createWriteStream(path);
        res.pipe(filePath);
        filePath.on("finish", () => {
          filePath.close();
          console.log(`:: Downloaded ${fileName} ::`);
          resolve(path);
        });
      });
    });
    return filePath;
  } catch (error) {
    throw new Error(`File download error: ${error}`);
  }
};

interface Tweet {
  id: string;
  mediaId: string;
  url: string;
}

const run = async () => {
  // Grab all posts from tumblr
  const posts = await getAllTumblrPosts();

  // find an unused post
  const post = await findUniquePost(posts);

  // download that file
  const filePath = await downloadFile(post);
  console.log(filePath);

  // tweet that shit out
  const mediaId = await twitterClient.v1.uploadMedia(filePath as string);
  console.log(mediaId);
  const tweetResponse = await twitterClient.v2.tweet({
    media: { media_ids: [mediaId] },
  });
  // update notion
  if (tweetResponse) {
    const tweet: Tweet = {
      id: post.id,
      mediaId,
      url: tweetResponse.data.text,
    };
    console.log(tweet);
    await addPostToNotion(tweet);
  }
};

run();
