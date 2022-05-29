const express = require("express");
const mongoose = require("mongoose");
const ejs = require("ejs")
const fileUpload = require('express-fileupload');
const path = require("path")
const app = express();
const port = 9999;
const fs = require("fs")
const form = require("./schemas/form");
const count = require("./schemas/user");
const chat = require("./schemas/chat");
const Post = require("./schemas/Post");
const Logger = require("./utils/logger")
const logger = new Logger()
var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
mongoose.connect("mongodb://localhost:27017/AppInventor", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

app.engine("html", ejs.renderFile);
app.set("view engine", "html");
app.set('views', path.join(__dirname, 'public'));
app.use(express.static('public/static'));
app.use(fileUpload({
    createParentPath: true
}));


app.get('/login', async (req, res) => {
    const loginForm = await form.findOne({
        name: req.query.username
    })
    if(!loginForm) {
        return res.send("No")
    }
    ////console.log(loginForm)
    if (req.query.password === loginForm.password) {
        if(loginForm.verified === true) {
            logger.info("Login -> " + req.query.username)
            return res.send("Ok")
        }
        else {
            return res.send("NoMail"); 
        }     
    } else {
        return res.send("No");
    }
});

app.get('/register', async (req, res) => {
    const registerForm = await form.findOne({
        name: req.query.username
    });
    const code = generateCode();
    if(!registerForm) {
        form.create({
            name: req.query.username,
            mail: req.query.mail,
            password: req.query.password,
            code: code,
            count: await counterId()
        });
        sendMail(req.query.mail, code);
        logger.debug("New user registered")
        logger.info("Mail sended to user: " + req.query.mail + " with username " + req.query.username)
        return res.send("Ok");
    } else {
        return res.send("No");
    }
});

app.get('/verify', async (req, res) => {
    const verifyForm = await form.findOne({
        code: req.query.code
    });
    if(!verifyForm) {
        return res.send("Code not found");
    } else if (verifyForm.verified === false) {
        verifyForm.verified = true;
        verifyForm.save();
        logger.debug("User verified")
        return res.send("Verified");
    } else if (verifyForm.verified === true) {
        return res.send("Already verified");
    }
});

app.get('/chat/users', async(req, res) => {
    ////console.log(req.query.user)
    switch (req.query.type) {
        case "total":
            const Count = await count.findOne({});
            //console.log(Count.count)
            res.send(Count.count.toString());
            break;
        case "user":
            switch(req.query.info) {
                case "name":
                    const User = await form.findOne({
                        count: req.query.count
                    });
                    //console.log(Object(User.name))
                    logger.debug("Getting username: " + User.name)
                    res.send(User.name);
                    logger.success("Action completed.")
                    break;
                case "mail":
                    const UserMail = await form.findOne({
                        count: req.query.count
                    });
                    //console.log(Object(UserMail.mail))
                    logger.debug("Getting mail: " + UserMail.mail)
                    res.send(UserMail.mail);
                    logger.success("Action completed.")
                    break;
                case "image":
                    const UserImage = await form.findOne({
                        count: req.query.count
                    });
                    //console.log(Object(UserImage.profileIMG))
                    logger.debug("Getting image: " + UserImage.profileIMG)
                    res.send(UserImage.profileIMG);
                    logger.success("Action completed.")
                    break;
            }
            
    }

})

app.get('/chat/messages', async (req, res) => {
    try {
	if (req.query.user1 && req.query.user2) {
		const Chat = await chat.findOne({
			users: [req.query.user1, req.query.user2]
			
		});
		if (!Chat) {
			const Chat2 = await chat.findOne({
				users: [req.query.user2, req.query.user1]
				
			});
			if (!Chat2) {
				const createChat = await chat.create({
					users: [req.query.user1, req.query.user2]
				});
                await createChat.save()

                let messages = "";
                for (let i = 0; i < createChat.messages.length; i++) {
                    messages += Object(createChat.messages[i].user) + ": " + Object(createChat.messages[i].message) + "\n"
                }
                res.send(messages);
			} else {
                let messages = "";
                for (let i = 0; i < Chat2.messages.length; i++) {
                    messages += Object(Chat2.messages[i].user) + ": " + Object(Chat2.messages[i].message) + "\n"
                }
                res.send(messages);
            }
			
		} else {
            let messages = "";
            for (let i = 0; i < Chat.messages.length; i++) {
                //console.log(Chat.messages[i])
                messages += Object(Chat.messages[i].user) + ": " + Object(Chat.messages[i].message) + "\n"
                //console.log(Object(Chat.messages[i].user) + ": " + Object(Chat.messages[i].message) + "\n");
                //console.log(messages)
            }
            res.send(messages);
        }
	}
    } catch (err) {
        //console.log("Creating chat failed, " + err);
    }
});

app.get('/chat/messages/send', async(req, res) => {
    //console.log(req.query.user1)
    //console.log(req.query.user2)
    const Chat = await chat.findOne({
        users: [req.query.user1, req.query.user2]
    });
    ////console.log(Chat)
    if(!Chat) {
        const Chat2 = await chat.findOne({
            users: {
                $all: [req.query.user2, req.query.user1]
            }
        });
        ////console.log("Chat2" + Chat2)
        if(!Chat2) {
            return //console.log("No chat found");
        } else {
            Chat2.messages.push({
                user: req.query.user1,
                message: req.query.message
            });
            Chat2.save();
            return //console.log("Ok");
        }
    } else {
    Chat.messages.push({
        user: req.query.user1,
        message: req.query.message
    });
    Chat.save();
    res.send("Ok");
}
});


app.get('/users/settings/get', async(req, res) => {
    if(req.query.user && req.query.get) {
        switch(req.query.get) {
            case "lang":
                const langDB = await form.findOne({
                    name: req.query.user
                });
                //console.log(langDB)
                logger.debug("Lang DB requested")
                res.send(langDB.language)
                break;
        }
    }
});

app.get('/users/settings/set', async(req, res) => {
    if(req.query.user && req.query.set) {
        switch(req.query.set) {
            case "lang":
                if(!req.query.lang) return;
                const langDB = await form.findOne({
                    name: req.query.user
                });
                langDB.language = req.query.lang;
                langDB.save();
                res.send("Ok")
                break;
        }
    }
})

app.get('/', (req,res) => {
    res.send("Server Online")
});
/*
app.post("/post/image", async(req, res) => {
    const id = generateCode();
    //console.log(req)
    const data = require("./thing.json");
    if(!data) return res.send("No data");

    if(!req.files) return res.send("No files");
    console.log(req.files?.file)
    let image = req.files;
    avatar.mv('./public/static/images/' + id + '.png');

    const post = await Post.findOne({
        id: '1'
    });
    if(!post) {
        const post = new Post({
            id: '1',
            posts: [{
                user: data.username,
                text: data.text,
                post: id,
                date: Date.now()
            }]
        });
        await post.save();
    } else {
        await post.post.push({
            user: data.username,
            text: data.text,
            post: id,
            date: Date.now()
        });
        await post.save();
    }
    res.send("Ok IMG");
    logger.success("Action completed. [POST IMAGE]")
})


app.get('/post', async(req,res) => {
    if(req.query.user && req.query.text) {
        var jsonData = `{"username": "${req.query.user}", "text": "${req.query.text}"}`;
        var jsonObj = JSON.parse(jsonData);
        var jsonContent = JSON.stringify(jsonObj);
        fs.writeFile("thing.json", jsonContent, 'utf-8', function (err) {
            if(err) {
                return logger.error("Error writing to file: " + err)
            }
            logger.debug("JSON file written")
        })
    }
    res.send("Ok");
    logger.success("Action completed. [GET DATA]")
})
*/

app.get('/post', async(req,res) => {
    if(req.query.user && req.query.text && req.query.post) {
        var today = new Date();
        var dd = String(today.getDate()).padStart(2, '0');
        var mm = String(today.getMonth() + 1).padStart(2, '0');
        var yyyy = today.getFullYear();
        today = mm + '/' + dd + '/' + yyyy;
        const post = await Post.findOne({
            id: '1'
        });
        if(!post) {
            const post = new Post({
                id: '1',
                posts: [{
                    user: req.query.user,
                    text: req.query.text,
                    post: req.query.post,
                    date: today
                }]
            });
            await post.save();
        } else {
            await post.post.push({
                user: req.query.user,
                text: req.query.text,
                post: req.query.post,
                date: today
            });
            await post.save();
        }
        res.send("Ok");
        logger.success("Action completed. [GET DATA]")
    }
})

app.get("/home", async(req, res) => {
    const post = await Post.findOne({
        id: '1'
    });
    console.log(post.post.length)
    res.render("main.ejs", {
        post: post,
        number: post.post.length
    })
})

app.get('/profile/set', async(req, res) => {
    if(!req.query.type && req.query.user) return;
    switch (req.query.type) {
        case "username":
            if(req.query.user == req.query.newuser) {
                return res.send("SameUser")
            }
            const User = await form.findOne({
                name: req.query.user
            });
            const NewUserCatch = await form.findOne({
                name: req.query.newuser
            });
            if(NewUserCatch) return res.send("UserExists")
            if(!User) return res.send("UserNoExists")
            console.log(User)
            User.name = req.query.newuser
            User.save()
            res.send("Ok")
            break;
        case "mail":
            const Mail = await form.findOne({
                name: req.query.user
            });
            const NewMailCatch = await form.findOne({
                mail: req.query.newmail
            });
            if(NewMailCatch) return res.send("MailExists")
            if(!Mail) return res.send("UserNoExists");
            console.log(Mail)
            Mail.mail = req.query.newmail
            Mail.save()
            res.send("Ok")
            break;
        case "pfp":
            const PFP = await form.findOne({
                name: req.query.user
            });
            if(!PFP) return res.send("UserNoExists");
            PFP.profileIMG = req.query.newpfp
            PFP.save()
            res.send("Ok")
            break;
    }
})

app.listen(port, () => {
    //console.log("API is running on port " + port);
    logger.success("API is running on port " + port)
})


function generateCode() {
    var result = '';
    var charactersLength = characters.length;
    for ( var i = 0; i < 50; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
     }
    return result;
}
const nodemailer = require("nodemailer");
function sendMail(mail, code) {
    let transporter = nodemailer.createTransport({
        host: 'in-v3.mailjet.com',
        port: <port>,
        auth: {
            user: "<user>",
            pass: "<pass>"
        }
    })

    message = {
        from: "no-reply@araarastudios.ga",
        to: mail,
        subject: "Verificación de cuenta",
        text: "http://<ip>:9999/verify?code=" + code
    }
    transporter.sendMail(message, function(err, info) {
        if (err) {
          //console.log(err)
        } else {
          //console.log(info);
        }
    })

}

async function counterId() {
    const Count = await count.findOne({});
    //console.log(Count)
    if(!Count) {
        count.create({
            count: 0
        });
    } else {
        Count.count++;
        Count.save();
    }
    return Count.count;
}