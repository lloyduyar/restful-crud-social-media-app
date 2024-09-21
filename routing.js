const bodyParser = require("body-parser");
const express = require("express");
const session = require("express-session");
const app = express();
app.disable("x-powered-by");
const compression = require("compression");
app.use(compression());

const http = require("http");
const socketIO = require("socket.io");
const server = http.createServer(app);
const io = socketIO(server);

const LowdbStore = require("lowdb-session-store")(session);
const lowdb = require("lowdb");
const FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("session.json", { defaultValue: [] });
const sessiondb = lowdb(adapter);

app.use(
  session({
    secret: "149857",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 18000000 },
    store: new LowdbStore(sessiondb, {
      ttl: 18000000,
    }),
  })
);

const multer = require("multer");
const storage = multer.memoryStorage();
//const upload = multer({ storage: storage });
const upload = multer({
  storage: storage,
});

const colors = require("colors/safe");
colors.enable();
app.set("view engine", "ejs");
const fs = require("fs").promises;
const chokidar = require("chokidar");
const watcher = chokidar.watch("database.db");
const path = require("path");
var uid = require("uid-safe");
const { env } = require("process");
require("dotenv").config();
const port = process.env.PORT || 3000;

app.get("/test", (req, res) => {
  res.render("test");
});

// User Credentials Database
let Datastore = require("nedb"),
  db = new Datastore({ filename: "database.db", autoload: true });

// All Posts Database
let postsDB = require("nedb"),
  posts = new postsDB({ filename: "posts.db", autoload: true });

//SESSION STORAGE **Data Stored In server memory
let MemoryDataStore = require("nedb");
db2 = new MemoryDataStore();

// Contact Form Database
let ContactDataStore = require("nedb");
contactDB = new ContactDataStore({ filename: "contact.db", autoload: true });
const util = require("util");
const dbFindOne = util.promisify(db.findOne.bind(db));
const dbFind = util.promisify(db.find.bind(db));

const Joi = require("joi");
const loginSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.any(),
  admin: Joi.boolean().required(),
  timeLoggedIn: Joi.date().required(),
});
const SignUp = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.any(),
  email: Joi.any(),
  admin: Joi.boolean().required(),
  timeLoggedIn: Joi.date().required(),
  _id: Joi.any(),
});
const bcrypt = require("bcrypt");
const saltRounds = 12;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("dependencies"));
app.use(express.static("css"));
app.use(express.static("js"));
app.use(express.static("html"));
app.use(express.static("img"));
app.use(express.json());

const newuser = (req, res, next) => {
  if (!req.session.newUser) {
    return res.redirect("/login");
  }
  next();
};
const auth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }
  next();
};
/*---------------------------------------*/

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/html/index.html");
});
app.get("/login", (req, res) => {
  res.sendFile(__dirname + "/html/login.html");
});
app.get("/signup", (req, res) => {
  res.sendFile(__dirname + "/html/signup.html");
});
app.get("/recoverAccount", (req, res) => {
  //res.render("recover");
  res.send(
    "<h1 style='text-align:center; color: navy;padding-top: 50vh;'>coming soon</h1>"
  );
});
app.post("/contact", (req, res) => {
  const contactForm = {
    name: req.body.name,
    email: req.body.email,
    message: req.body.message,
  };
  contactDB.insert(contactForm, (err, document) => {});
  res.redirect("/");
});

app.post("/signup", (req, res) => {
  let newUser;
  const uniqueId = uid.sync(18);
  const SignUpSchema = {
    username: req.body.username,
    password: req.body.password,
    email: req.body.email,
    admin: false,
    timeLoggedIn: new Date().getTime(),
    _id: uniqueId,
  };
  const validationResult = SignUp.validate(SignUpSchema);
  if (validationResult.error) {
    return res.render("validationerror", {
      error: validationResult.error.message,
    });
  } else {
    checkIfExist(SignUpSchema.username, SignUpSchema.email);
    function checkIfExist(username, email) {
      const query = { username: username };
      const query2 = { email: email };
      try {
        db.find(query, function (err, docs) {
          if (err) {
            console.log(err);
            return;
          }
          if (docs.length > 0) {
            res.render("exist", { error: "username or email already exist" });
          } else {
            db.find(query2, function (err, docs) {
              if (err) {
                console.log(err);
                return;
              }
              if (docs.length > 0) {
                res.render("exist", {
                  error: "username or email already exist",
                });
              } else {
                hashPassword(SignUpSchema.password);
                async function hashPassword(password) {
                  bcrypt.hash(password, saltRounds).then(function (hash) {
                    const hashedSchema = {
                      username: req.body.username,
                      password: hash,
                      email: req.body.email,
                      admin: false,
                      timeLoggedIn: new Date().getTime(),
                      _id: uniqueId,
                      newUser: true,
                    };
                    db.insert(hashedSchema, function (err, newDoc) {});
                    res.redirect("/login");
                  });
                }
              }
            });
          }
        });
      } catch {}
    }
  }
  //db.insert(SignUpSchema, function (err, newDoc) {});
});
app.post("/login", async (req, res) => {
  logHash();
  function logHash() {
    const newSchema = {
      username: req.body.username,
      password: req.body.password,
      admin: false,
      timeLoggedIn: new Date().getTime(),
    };
    const validationResult = loginSchema.validate(newSchema);
    //db.insert(newSchema, function (err, newDoc) {});
    if (validationResult.error) {
      return res.render("invalid", {
        error: validationResult.error.message,
      });
    }
    try {
      const { username, password } = newSchema;
      const query = { username: username };
      const storedHash = db.find(query, function (err, docs) {
        if (err) {
          console.error(err);
          return;
        }
        if (docs.length > 0) {
          const savedHash = docs[0].password;
          checkUser(username, password, savedHash, newSchema.admin);
        } else {
          res.render("invalid", {
            error:
              "Invalid username or password. Please double-check your login credentials and try again. ",
          });
        }
      });
      async function checkUser(username, password, savedHash, admin) {
        const match = await bcrypt.compare(password, savedHash);
        if (match) {
          db.find(query, function (err, docs) {
            if (err) {
              console.error(err);
              return;
            }
            if (docs.length > 0) {
              const newUser = docs[0].newUser;
              req.session.newuser = username;
              req.session.newUserBool = true;
              if (newUser) {
                res.render("topics", {
                  username,
                  admin,
                });
                db.persistence.compactDatafile();
                //req.session.user = username;
              } else {
                db.persistence.compactDatafile();
                req.session.user = username;
                res.redirect("/feed");
              }
            } else {
            }
          });
        } else {
          res.render("invalid", {
            error:
              "Invalid username or password. Please double-check your login credentials and try again. ",
          });
        }
      }
    } catch (error) {
      console.error(error);
      return res
        .status(500)
        .send("Internal server error. Please try again later.");
    }
  }
});
app.post("/search", auth, (req, res) => {
  const searchInput = req.body.search;
  const regex = new RegExp(searchInput, "i");

  db.find({ username: regex }, (err, docs) => {
    if (err) {
      return res.status(500).json({ error: "Internal Server Error" });
    }

    const securitySchema = {
      username: req.session.user,
      results: docs,
      query: searchInput,
    };

    console.log(securitySchema);
    res.json(securitySchema);
    //res.render("result", { securitySchema });
  });
});

app.post("/upload", upload.single("file"), auth, async (req, res) => {
  db.persistence.compactDatafile();
  try {
    if (!req.file) {
      return res.json({ msg: 1 });
    }

    const bufferData = req.file.buffer;
    const base64String = bufferData.toString("base64");

    // Check if the file size exceeds the limit
    if (req.file.size > 50 * 1024) {
      return res.status(400).json({ error: "tooBig" });
    }

    db.findOne({ username: req.session.user }, (err, user) => {
      if (err) {
        res.status(500).json({ error: "Internal server error" });
        return;
      }
      db.update(
        { username: req.session.user },
        { $set: { pfp: base64String } },
        { multi: true, upsert: true },
        (err, numUpdated) => {
          if (err) {
            reject(err);
          } else {
            db.persistence.compactDatafile();
          }
        }
      );
    });

    db.persistence.compactDatafile();
    res.json({ success: "success" });
  } catch (error) {}
});

app.post("/updateBio", auth, (req, res) => {
  db.persistence.compactDatafile();
  const username = req.session.user;
  db.findOne({ username }, (err, user) => {
    if (err) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    if (req.body.bio.length <= 100) {
      db.update(
        { username: username },
        { $set: { bio: [req.body.bio] } },
        { multi: false },
        (err, numUpdated) => {
          if (err) {
            console.error(err);
            return res.redirect("/login");
          } else {
            db.persistence.compactDatafile();
            res.json({ msg: "success" });
          }
        }
      );
    } else {
      res.json({ msg: "error" });
    }
  });
});

app.post("/followers", auth, (req, res) => {
  db.persistence.compactDatafile();

  db.findOne({ username: req.body.userToSeeFollowers }, (err, user) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    if (!user) {
      return res.render("404");
    }
    let userFollowers = user.followers;
    res.json({
      user: req.body.userToSeeFollowers,
      followers: userFollowers,
    });
  });
});
app.post("/following", auth, (req, res) => {
  db.persistence.compactDatafile();
  db.findOne({ username: req.body.userToSeeFollowing }, (err, user) => {
    if (err) {
      res.status(500).json({ error: "Internal Server Error" });
      return;
    }
    if (!user) {
      return res.render("404");
    }
    let userFollowing = user.following;
    res.json({
      user: req.body.userToSeeFollowing,
      following: userFollowing,
    });
  });
});

app.post("/toggleFollow", auth, (req, res) => {
  db.persistence.compactDatafile();
  const userToFollowOrUnfollow = req.body;
  const currentUser = req.session.user;

  if (
    !currentUser ||
    currentUser === userToFollowOrUnfollow.userToFollowOrUnfollow
  ) {
    return res.status(403).json({ success: false, error: "Invalid operation" });
  } else {
    db.findOne(
      { username: userToFollowOrUnfollow.userToFollowOrUnfollow },
      (err, user) => {
        if (err) {
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        if (!user) {
          return res
            .status(404)
            .json({ success: false, error: "User not found" });
        }

        if (user.followers.includes(currentUser)) {
          db.update(
            { username: user.username },
            { $pull: { followers: currentUser } },
            {},
            (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ success: false, error: "Internal server error" });
              }
              db.update(
                { username: currentUser },
                { $pull: { following: user.username } },
                {},
                (err) => {
                  if (err) {
                    return res
                      .status(500)
                      .json({ success: false, error: "Internal server error" });
                  }
                  res.json({
                    success: true,
                    following: false,
                    followingCount: user.following.length,
                    followerCount: user.followers.length,
                  });
                }
              );
            }
          );
        } else {
          db.update(
            { username: user.username },
            { $addToSet: { followers: currentUser } },
            {},
            (err) => {
              if (err) {
                return res
                  .status(500)
                  .json({ success: false, error: "Internal server error" });
              }
              db.update(
                { username: currentUser },
                { $addToSet: { following: user.username } },
                {},
                (err) => {
                  if (err) {
                    return res
                      .status(500)
                      .json({ success: false, error: "Internal server error" });
                  }
                  res.json({
                    success: true,
                    following: true,
                    followingCount: user.following.length,
                    followerCount: user.followers.length,
                  });
                }
              );
            }
          );
        }
      }
    );
  }
});

app.post("/submitPost", upload.single("file"), auth, async (req, res) => {
  db.persistence.compactDatafile();
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  let serverSchema = JSON.parse(req.body.data);
  if (req.session.user === serverSchema.author.postCreatorUsername) {
    //file = req.file;
    try {
      /*if (!req.file) {
    return res.json({ msg: 1 });
  }
  if (req.file.size > 50 * 1024) {
    return res.status(400).json({ error: "tooBig" });
  }
  const bufferData = file.buffer;
  const base64String = bufferData.toString("base64");
  */

      const newPost = {
        postId: uid.sync(18),
        author: {
          postCreatorId: serverSchema.author.postCreatorId,
          postCreatorUsername: serverSchema.author.postCreatorUsername,
          postCreatorPfp: serverSchema.author.postCreatorPfp,
        },
        content: {
          postTextContent: serverSchema.content.postTextContent,
          // postImageContent: base64String,
          postTimeStamp: formattedDate,
          postLikes: [],
          postComments: [],
          postTopics: serverSchema.content.postTopics,
        },
      };
      const poster = newPost.author.postCreatorUsername;
      db.findOne({ username: poster }, (err, user) => {
        if (err) {
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        if (!user) {
          res.render("usernotfound404.ejs");
          return;
        }
        db.update(
          { username: poster },
          { $addToSet: { posts: newPost } },
          { multi: false },
          (err, numUpdated) => {
            if (err) {
              console.error(err);
              return res.redirect("/login");
            }
          }
        );
        db.persistence.compactDatafile();
        res.json({ saved: true });
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.json({ error: "Not Allowed" });
  }
});

app.post("/deletePost", auth, (req, res) => {
  const userToVerify = req.body.username;
  const serverUser = req.session.user;
  const postId = req.body.postId;

  if (serverUser != userToVerify) {
    res.redirect("/logout");
    return;
  }
  db.update(
    { username: serverUser },
    { $pull: { posts: { postId: postId } } },
    {},
    function (err, numRemoved, newDoc) {
      if (err) {
        console.error(err);
      } else {
        res.json({ deleted: true });
      }
    }
  );
});

app.post("/renderPosts", auth, (req, res) => {
  let userToSeePost = req.body.userToSeePost;
  db.findOne({ username: userToSeePost }, (err, user) => {
    if (err) {
      res.status(500).json({ error: "Internal server error" });
      return;
    }
    if (!user) {
      res.render("usernotfound404.ejs");
      return;
    }

    if (user.posts.length > 0) {
      let posts = user.posts;
      db.findOne({ username: userToSeePost }, (err, user) => {
        if (err) {
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        if (!user) {
          res.render("usernotfound404.ejs");
          return;
        }
        db.persistence.compactDatafile();
        let updatedPfp = user.pfp;
        res.json({ posts, updatedPfp });
      });
    } else {
      res.json({ msg: "No Posts" });
    }
    db.persistence.compactDatafile();
  });
});

app.get(`/profile/:username`, auth, async (req, res) => {
  let postIndex;
  let authorPfp;
  let authorUsername;
  let postTimeStamp;
  let postText;
  let postImage;
  let postTopic;
  let postLike;
  let postComments;

  db.persistence.compactDatafile();
  try {
    const username = req.params.username;

    // Function to find the user and log the base64 string
    function findUserPFP() {
      db.findOne({ username }, (err, user) => {
        if (err) {
          res.status(500).json({ error: "Internal server error" });
          return;
        }
        if (!user) {
          res.render("usernotfound404.ejs");
          return;
        }

        let dataUrl;
        if (user && user.pfp && user.pfp.length > 0) {
          const base64Image = user.pfp;
          dataUrl = `data:image/jpeg;base64,${base64Image}`;
          db.persistence.compactDatafile();
        } else {
          dataUrl =
            "/user-profile-2018-in-sight-user-conference-expo-business-default-png-favpng-5EdhQJprgN1HKZdx50LCN4zXg.jpg";
        }
        let currentUser = user.username;

        if (user.posts && user.posts.length > 0) {
          user.posts.forEach((post, index) => {
            postIndex = index;
            authorPfp = user.pfp;
            authorUsername = user.username;
            postTimeStamp = post.content.postTimeStamp;
            postText = post.content.postTextContent;
            postImage = post.content.postImageContent;
            postTopic = post.content.postTopic;
            postLike = post.content.postLikes;
            postComments = post.content.postComments;
          });
        } else {
        }
        const securitySchema = {
          username: user.username,
          email: user.email,
          admin: user.admin,
          newUser: user.newUser,
          topics: user.topics,
          timeCreatedAccount: user.timeCreated,
          bio: user.bio[0],
          _id: user._id,
          followers: user.followers,
          following: user.following,
          pfp: dataUrl,
          postIndex,
          authorPfp,
          authorUsername,
          postTimeStamp,
          postText,
          postImage,
          postTopic,
          postLike,
          postComments,
          postsNumber: user.posts.length,
          currentUser: req.session.user,
        };
        db.persistence.compactDatafile();
        res.render("profile", { securitySchema });
      });
    }

    // Call the function to find the user and log the base64 string
    findUserPFP();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/toggleLike", auth, (req, res) => {
  let postToLike = req.body.postToLike;
  let username = req.session.user;

  // Step 1: Find the post
  console.log(postToLike, username);
  db.findOne({ "posts.postId": postToLike }, (err, userWithPost) => {
    if (err) {
      return res.status(500).json({ error: "Internal server error" });
    }
    if (!userWithPost || !userWithPost.posts) {
      return res
        .status(404)
        .json({ success: false, error: "Post not found or invalid structure" });
    }

    const postIndex = userWithPost.posts.findIndex(
      (post) => post.postId === postToLike
    );
    if (postIndex !== -1) {
      // Access the postLikes array for the found post
      const postLikes = userWithPost.posts[postIndex].content.postLikes;

      // Toggle the like
      const userLikedIndex = postLikes.indexOf(username);
      if (userLikedIndex !== -1) {
        // User has already liked, remove the like
        postLikes.splice(userLikedIndex, 1);
      } else {
        // User hasn't liked, add the like
        postLikes.push(username);
      }

      // Save the changes
      const updateQuery = { "posts.postId": postToLike };
      const updateData = { $set: {} };
      updateData.$set[`posts.${postIndex}.content.postLikes`] = postLikes;

      db.update(updateQuery, updateData, {}, (err) => {
        if (err) {
          return res.status(500).json({ error: "Internal server error" });
        }
        res
          .status(200)
          .json({ success: true, message: "Like toggled successfully" });
      });
    } else {
      res
        .status(404)
        .json({ success: false, error: "Post not found or invalid structure" });
    }
  });

  /*
  db.update(
    { username },
    { $addToSet: { postsLiked: postToLike } },
    {},
    (err, numUpdated) => {
      if (err) {
        return res.status(500).json({ error: "Internal server error" });
      }
      if (numUpdated === 0) {
        return res
          .status(404)
          .json({ success: false, error: "User not found" });
      }

      // Step 2: Find the post and update postLikes array
      db.findOne({ "posts.postId": postToLike }, (err, userWithPost) => {
        if (err) {
          return res.status(500).json({ error: "Internal server error" });
        }
        if (!userWithPost || !userWithPost.posts) {
          return res.status(404).json({
            success: false,
            error: "Post not found or invalid structure",
          });
        }

        const postIndex = userWithPost.posts.findIndex(
          (post) => post.postId === postToLike
        );
        console.log(postIndex);
        if (postIndex !== -1) {
          // Access the postLikes array for the found post
          const postLikes = userWithPost.posts[postIndex].content.postLikes;
          console.log(postLikes);
          // Update the postLikes array
          if (!postLikes.includes(username)) {
            postLikes.push(username);

            // Save the changes
            const updateQuery = { "posts.postId": postToLike };
            const updateData = { $set: {} };
            updateData.$set[`posts.${postIndex}.content.postLikes`] = postLikes;

            db.update(updateQuery, updateData, {}, (err) => {
              if (err) {
                return res.status(500).json({ error: "Internal server error" });
              }
              res
                .status(200)
                .json({ success: true, message: "Post liked successfully" });
            });
          } else {
            res.status(200).json({
              success: false,
              message: "Post already liked by the user",
            });
          }
        } else {
          res.status(404).json({
            success: false,
            error: "Post not found or invalid structure",
          });
        }
      });
    }
  );
  */
});

app.post("/verifyProfilePage", auth, (req, res) => {
  const verifySchema = {
    username: req.body.username,
    email: req.body.email,
    _id: req.body._id,
  };
  console.log(verifySchema);
  if (verifySchema.username == req.session.user) {
    res.json({ canEdit: true });
  } else {
    res.json({ canEdit: false });
  }
});

app.get("/feed", auth, (req, res) => {
  console.log(req.session.user);
  let user = req.session.user;
  const securitySchema = {
    username: user,
  };
  res.render("index", { securitySchema });
});

app.post("/getfeed", auth, async (req, res) => {
  console.log(req.body.user + ": POST REQUEST FOR USER FEED");
  const currentUserId = req.session.user;

  try {
    const currentUser = await dbFindOne({ username: currentUserId });

    if (!currentUser) {
      return res.redirect("/login");
    }

    // Fetch followers of the current user
    const followers = currentUser.followers || [];
    const followersData = await dbFind({ username: { $in: followers } });

    // Collect random posts from each follower
    const followerPosts = followersData.reduce((posts, follower) => {
      const randomFollowerPosts = follower.posts || [];
      const randomIndex = Math.floor(
        Math.random() * randomFollowerPosts.length
      );
      const randomPost = randomFollowerPosts[randomIndex];
      if (randomPost) {
        posts.push(randomPost);
      }
      return posts;
    }, []);

    // Fetch followed users
    const following = currentUser.following;
    const followedUsers = await dbFind({ username: { $in: following } });

    // Collect posts from followed users
    const followedPosts = followedUsers.reduce((posts, user) => {
      return posts.concat(user.posts || []);
    }, []);

    // Continue with your existing logic to format posts from both followers and followed users
    for (let i = 0; i < followedPosts.length; i++) {
      const user = await dbFindOne({
        username: followedPosts[i].author.postCreatorUsername,
      });

      if (!user) {
        return res.render("usernotfound404.ejs");
      }

      followedPosts[
        i
      ].author.postCreatorPfp = `data:image/jpeg;base64,${user.pfp}`;
    }
    // Sort the posts from followers
    followerPosts.sort(
      (a, b) =>
        new Date(b.content.postTimeStamp) - new Date(a.content.postTimeStamp)
    );

    // Sort the posts from followed users
    followedPosts.sort(
      (a, b) =>
        new Date(b.content.postTimeStamp) - new Date(a.content.postTimeStamp)
    );

    res.json({ followerPosts, followedPosts });
    db.persistence.compactDatafile();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
    } else {
      // Redirect or perform other actions after session destruction
      res.redirect("/login");
    }
  });
});

app.get(`/posts/:username/:id`, auth, async (req, res) => {
  const username = req.params.username;
  try {
    db.findOne({ username }, (err, user) => {
      if (err) {
        res.status(500).json({ error: "Internal server error" });
        return;
      }
      if (!user) {
        res.render("usernotfound404.ejs");
        return;
      }
      const postToFind = decodeURIComponent(req.params.id);
      let foundObject = null;

      for (let i = 0; i < user.posts.length; i++) {
        const post = user.posts[i];
        if (post.postId == postToFind) {
          foundObject = post;
          break;
        }
      }
      if (foundObject) {
        const postSchema = {
          postId: foundObject.postId,
          author: {
            postCreatorId: foundObject.author.postCreatorId,
            postCreatorUsername: foundObject.author.postCreatorUsername,
            postCreatorPfp: foundObject.author.postCreatorPfp,
          },
          content: {
            postTextContent: foundObject.content.postTextContent,
            postTimeStamp: foundObject.content.postTimeStamp,
            postLikes: foundObject.content.postLikes,
            postComments: foundObject.content.postComments,
            postTopics: foundObject.content.postTopics,
          },
        };

        const postHTML = `
        <div class="post-card" id="${postSchema.postId}" style="display: block; margin-bottom: 10%">
        <div class="post-profile">
          <img src="${postSchema.author.postCreatorPfp}" alt="user-profile" class="profile-image">
          <div class="profile-info">
            <div class="post-author">${postSchema.author.postCreatorUsername}</div>
            <div class="post-timestamps">${postSchema.content.postTimeStamp}</div>
          </div>
        </div>
        <div class="post-content" style="/*overflow-y: scroll;*/ padding-top: 5px; padding-bottom: 10px; padding-left: 1%;">
        ${postSchema.content.postTextContent}
        </div>
        <div id="postImage">
          <!--<img  alt="post" class="post-image">-->
        </div>
        <div class="post-topics">${postSchema.content.postTopics}</div>
        <div class="post-interactions">
          <button id="${postSchema.postId}" class="likeButton btn" style="color: pink; font-size: 30px;" onclick="likePost()">&#x2764;</button>
          <button id="likecount" class="likes-section btn" id="likeCount" style="font-size: 30px;"> ${postSchema.content.postLikes.length}</button>
        </div>
      </div>
        `;

        const username = {
          username: req.session.user,
          data: postHTML,
        };
        res.render("post.ejs", { username });
      } else {
        res.render("postNotFound.ejs");
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
  db.persistence.compactDatafile();
});

app.post("/topics", (req, res) => {
  req.session.user = req.session.newuser;
  const document = req.body.selectedTopics;

  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  //Add Topics to newUser
  db.update(
    { username: req.session.newuser },
    { $set: { topics: document } },
    { multi: false },
    (err, numUpdated) => {
      if (err) {
        console.error(err);
        return res.redirect("/login");
      }
    }
  );
  db.update(
    { username: req.session.newuser },
    { $set: { newUser: false } },
    { multi: false },
    (err, numUpdated) => {
      if (err) {
        console.log(err);
        return res.redirect("/login");
      }
    }
  );
  db.update(
    { username: req.session.newuser },
    { $set: { followers: [] } },
    { multi: false },
    (err, numUpdated) => {
      if (err) {
        console.log(err);
        return res.redirect("/login");
      }
    }
  );
  db.update(
    { username: req.session.newuser },
    { $set: { following: [] } },
    { multi: false },
    (err, numUpdated) => {
      if (err) {
        console.log(err);
        return res.redirect("/login");
      }
    }
  );
  db.update(
    { username: req.session.newuser },
    { $set: { timeCreated: formattedDate } },
    { multi: false },
    (err, numUpdated) => {
      if (err) {
        console.log(err);
        return res.redirect("/login");
      }
    }
  );
  db.update(
    { username: req.session.newuser },
    { $set: { bio: [] } },
    { multi: false },
    (err, numUpdated) => {
      if (err) {
        console.log(err);
        return res.redirect("/login");
      }
    }
  );
  db.update(
    { username: req.session.newuser },
    { $set: { pfp: [] } },
    { multi: false },
    (err, numUpdated) => {
      if (err) {
        console.log(err);
        return res.redirect("/login");
      }
    }
  );
  db.update(
    { username: req.session.newuser },
    { $set: { posts: [] } },
    { multi: false },
    (err, numUpdated) => {
      if (err) {
        console.log(err);
        return res.redirect("/login");
      }
    }
  );
  db.update(
    { username: req.session.newuser },
    { $set: { postsLiked: [] } },
    { multi: false },
    (err, numUpdated) => {
      if (err) {
        console.log(err);
        return res.redirect("/login");
      }
    }
  );
  res.redirect("/feed");
});

app.use((req, res, next) => {
  res.status(404).render("404");
});

server.listen(port, () => {});
server.keepAliveTimeout = 60000;
server.headersTimeout = 65000;
server.maxHttpHeaderSize = 65536;