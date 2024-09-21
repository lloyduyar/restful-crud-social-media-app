let selectedTopics = [];
function select(topicId) {
  const index = selectedTopics.indexOf(topicId);
  if (index === -1) {
    selectedTopics.push(topicId);
    //console.log(selectedTopics);
  } else {
    selectedTopics.splice(index, 1);
    // console.log(selectedTopics);
  }

  const topicCards = document.querySelectorAll(".card");
  topicCards.forEach((card) => {
    const id = card.getAttribute("id");
    card.style.border = selectedTopics.includes(id)
      ? "2px solid #0d6efd"
      : "none";
  });
}
async function sendSelections() {
  console.log(selectedTopics);
  if (selectedTopics.length == 0) {
    alert("choose at least topic.");
  } else {
    let response = await fetch("/topics", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedTopics }),
    });
    let data = await response.text();
    window.location.href = "/feed";
  }
}

function searchUser(event) {
  event.preventDefault();
  let user = document.getElementById("userToSearch").value;
  console.log(user);
  window.location.href = `/profile/${user}`;
}

if ("<%=securitySchema.username%>" == "<%=securitySchema.currentUser%>") {
  document.getElementById("followUnfollowButton").style.display = "none";
  document.getElementById("followUnfollowButton").onclick = null;
} else {
  document.getElementById("uploadImage").style.cursor = "default";
  document.getElementById("uploadImage").style.pointerEvents = "none";
  document.getElementById("uploadImage").onclick = null;
  document.getElementById("userBio").contentEditable = false;
  document.getElementById("userBio").style.cursor = "default";
  document.getElementById("userBio").pointerEvents = "none";
  document.getElementById("editSymbol").style.display = "none";
  document.getElementById("editSymbol").style.cursor = "default";
  document.getElementById("editSymbol").onclick = null;
  document.getElementById("followUnfollowButton").style.display = "inline";
  document.querySelector(".delete-post").style.display = "none";
  document.getElementById("newPostButton").style.display = "none";
}

async function check() {
  let verifyPage = {
    username: "<%=securitySchema.username%>",
    email: "<%=securitySchema.email%>",
    _id: "<%=securitySchema.email%>",
  };

  let response = await fetch("/verifyProfilePage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(verifyPage),
  });

  let data = await response.json();
  console.log(data.canEdit);
  if (data.canEdit === true) {
    document.getElementById("followUnfollowButton").style.display = "none";
    document.getElementById("followUnfollowButton").onclick = null;
    return true;
  } else {
    document.getElementById("uploadImage").style.cursor = "default";
    document.getElementById("uploadImage").style.pointerEvents = "none";
    document.getElementById("uploadImage").onclick = null;
    document.getElementById("userBio").contentEditable = false;
    document.getElementById("userBio").style.cursor = "default";
    document.getElementById("userBio").pointerEvents = "none";
    document.getElementById("editSymbol").style.display = "none";
    document.getElementById("editSymbol").style.cursor = "default";
    document.getElementById("editSymbol").onclick = null;
    document.getElementById("followUnfollowButton").style.display = "inline";
    document.querySelector(".delete-post").style.display = "none";
    document.querySelector(".post-card").style.display = "none";
    return false;
  }
}

(window.onload = check()), renderPosts();

async function renderPosts() {
  const userToSeePost = "<%=securitySchema.username%>";
  let response = await fetch("/renderPosts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userToSeePost: userToSeePost }),
  });
  let data = await response.json();
  console.log(data.posts);
  if (data.posts) {
    let postArr;
    let posts = data.posts;
    if (data.updatedPfp.length === 0 || data.updatedPfp === undefined) {
      dataUrl =
        "/user-profile-2018-in-sight-user-conference-expo-business-default-png-favpng-5EdhQJprgN1HKZdx50LCN4zXg.jpg";
    } else {
      dataUrl = `data:image/jpeg;base64,${data.updatedPfp}`;
    }
    if (posts) {
      posts.reverse();
      for (let i = 0; i < posts.length; i++) {
        let clonedPostCard = document
          .getElementById("initialPostCard")
          .cloneNode(true);
        let id = posts[i].postId;
        let profileImage = dataUrl;
        let profileAuthor = posts[i].author.postCreatorUsername;
        let postTimeStamp = posts[i].content.postTimeStamp;
        let postContent = posts[i].content.postTextContent;
        let postImage = posts[i].content.postImageContent;
        let postTopics = posts[i].content.postTopics;
        let postLikeCount = posts[i].content.postLikes.length;
        let postComment = posts[i].content.postLikes;

        clonedPostCard.setAttribute("id", id);
        clonedPostCard.querySelector(".profile-image").src = profileImage;
        clonedPostCard.querySelector(".post-author").textContent =
          profileAuthor;
        clonedPostCard.querySelector(".post-timestamps").textContent =
          postTimeStamp;
        clonedPostCard.querySelector(".post-content").textContent = postContent;

        /*if(postImage.length <= 0 || postImage == " " || postImage == ""){
          clonedPostCard.querySelector('.post-image').removeElement();
        }else{
          clonedPostCard.querySelector('.post-image').src = postImage;
        }*/

        clonedPostCard.querySelector(".post-topics").textContent = postTopics;
        clonedPostCard.querySelector(".likes-section").textContent =
          postLikeCount;

        let secureId = document.createElement("p");
        secureId.style.display = "none";
        secureId.setAttribute("id", "id" + id);
        secureId.textContent = id;
        clonedPostCard.append(secureId);
        if (
          "<%=securitySchema.username%>" === "<%=securitySchema.currentUser%>"
        ) {
          /*let deletePostBtn = document.createElement('btn');
        deletePostBtn.classList.add('btn')
        deletePostBtn.classList.add('btn-primary')
        deletePostBtn.style.cursor = "pointer";
        deletePostBtn.style.textAlign = "right";
        deletePostBtn.style.display = "inline";
        deletePostBtn.textContent = "Delete Post";
        deletePostBtn.style.fontSize = '12px';
        clonedPostCard.append(deletePostBtn)*/
          clonedPostCard.querySelector(".delete-post").style.display = "inline";
          clonedPostCard.querySelector(".delete-post").setAttribute("id", id);
        }
        let likeButton = document.getElementById(id);

        clonedPostCard.querySelector(".likeButton").setAttribute("id", id);
        clonedPostCard.style.display = "block";
        document.getElementById("postContainer").appendChild(clonedPostCard);
      }
    }
  } else {
    document.getElementById("noPosts").style.display = "block";
  }
}

async function deleteClonePost() {
  let postId = event.target.id;
  console.log(postId);
  let post = event.target;
  console.log(post);
  let response = await fetch("/deletePost", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      username: "<%=securitySchema.username%>",
      postId: postId,
    }),
  });
  let data = await response.json();
  console.log(data.deleted);
  if (data.deleted === true) {
    let deletedDoc = postId;
    window.location.reload();
  }
}
function checkInput() {
  // Get the input element
  var inputValue = document.getElementById("postContent").value;
  var maxValue = 250;

  if (parseInt(inputValue, 10) > maxValue) {
    alert("Input value cannot be over " + maxValue);
    return false;
  }
  submitPost();
  return true;
}

async function submitPost() {
  event.preventDefault();
  const currentDate = new Date();
  const day = currentDate.getDate();
  const month = currentDate.getMonth() + 1;
  const year = currentDate.getFullYear();
  const formattedDate = `${day}/${month}/${year}`;
  let postContent = document.getElementById("postContent");
  //let formInput = document.getElementById('postImageUpload');
  let topics = document.getElementById("topicsInput");

  PostContentValue = postContent.value;
  topicsValue = topics.value
    .split(/\s+/)
    .filter((word) => word.startsWith("#"));
  //const fileInput = formInput
  //const file = fileInput.files[0];
  const formData = new FormData();
  //formData.append('file', file);
  formData.append(
    "data",
    JSON.stringify({
      postId: undefined,
      author: {
        postCreatorId: "<%=securitySchema._id%>",
        postCreatorUsername: "<%=securitySchema.username%>",
        postCreatorPfp: "<%=securitySchema.pfp%>",
      },
      content: {
        postTextContent: PostContentValue,
        postImageContent: undefined,
        postTimeStamp: formattedDate,
        postLikes: [],
        postComments: [],
        postTopics: topicsValue,
      },
    })
  );

  const promise = await fetch("/submitPost", {
    method: "POST",
    body: formData,
  });
  let data = await promise.json();
  if (data.saved) {
    renderPosts();
    window.location.reload();
  } else if (data.error) {
    alert("Unauthorized");
  }
}

function clearForm() {
  let postContent = document.getElementById("postContent");
  let topics = document.getElementById("topicsInput");
  topics.value = "";
  postContent.value = "";
}

document.getElementById("postContent").addEventListener("input", function () {
  var maxLength = 250;
  var currentLength = this.value.length;
  var remaining = maxLength - currentLength + 1;

  // Update character count display
  document.getElementById("charCount").innerText =
    remaining + " characters remaining";

  // Limit the length of the input
  if (currentLength > maxLength) {
    this.value = this.value.slice(0, maxLength);
  }
});

async function seeFollowers() {
  let followerList = document.getElementById("followerList");
  followerList.innerHTML = "";

  const userToSeeFollowers = "<%=securitySchema.username%>";
  const response = await fetch("/followers", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userToSeeFollowers }),
  });
  const data = await response.json();
  if (data) {
    $(document).ready(function () {
      let followerList = document.getElementById("followerList");
      for (let i = 0; i < data.followers.length; i++) {
        console.log(data.followers[i]);
        let content = data.followers[i];
        let newElement = document.createElement("div");
        let linkContent = `<a href="/profile/${content}">${content}</a><br>`;
        newElement.innerHTML = linkContent;
        followerList.append(newElement);
      }
    });
  }
}

async function seeFollowing() {
  let followingList = document.getElementById("followingList");
  followingList.innerHTML = "";

  const userToSeeFollowing = "<%=securitySchema.username%>";
  const response = await fetch("/following", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ userToSeeFollowing }),
  });
  const data = await response.json();
  if (data) {
    $(document).ready(function () {
      let followingList = document.getElementById("followingList");
      for (let i = 0; i < data.following.length; i++) {
        let content = data.following[i];
        let newElement = document.createElement("div");
        let linkContent = `<a href="/profile/${content}">${content}</a><br>`;
        newElement.innerHTML = linkContent;
        followingList.append(newElement);
      }
    });
  }
}

let followUnfollowButton = document.getElementById("followUnfollowButton");
followUnfollowButton.addEventListener("click", async () => {
  const userToFollowOrUnfollow = "<%=securitySchema.username%>";
  try {
    const response = await fetch("/toggleFollow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userToFollowOrUnfollow }),
    });

    const data = await response.json();

    if (data.success) {
      followUnfollowButton.innerText = data.following ? "Unfollow" : "Follow";
      window.location.reload();
    } else {
      console.error("Error toggling follow status:", data.error);
    }
  } catch (error) {
    console.error("Error toggling follow status:", error);
  }
});

function openFileInput() {
  document.getElementById("imageInput").click();
}
async function uploadProfilePicture(event) {
  const fileInput = event.target;
  const file = fileInput.files[0];

  if (file) {
    const formData = new FormData();
    formData.append("file", file);

    let promise = await fetch("/upload", {
      method: "POST",
      body: formData,
    });
    let data = await promise.json();
    if (data.success) {
      document.getElementById("uploadImage").src = "<%= securitySchema.pfp %>";
      window.location.reload();
    } else {
      alert("File Too Big. Choose a file under 50kb.");
    }
  }
}
document
  .getElementById("userBio")
  .addEventListener("keydown", function (event) {
    if (event.key === "Enter") {
      event.preventDefault();
    }
  });
async function getBioContent() {
  let editableContent = document.getElementById("userBio");
  var content = editableContent.innerText;
  let response = await fetch("/updateBio", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ bio: content }),
  });
  let data = await response.text();
  if (data === "done") {
    window.location.reload();
  } else if (data.msg) {
    alert("Maximum 100 Characters In Bio!");
  }
}

async function likePost() {
  let likePostBtn = document.querySelector(".likeButton");
  const postToLike = event.target.id;
  console.log(postToLike);
  try {
    const response = await fetch("/toggleLike", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ postToLike }),
    });

    const data = await response.json();
    if (data) {
      window.location.reload();
    }
  } catch (error) {
    console.error("Error liking posts:", error);
  }
}
