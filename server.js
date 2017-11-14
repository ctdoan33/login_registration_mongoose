var express=require("express");
var app=express();
var path=require("path");
var session = require("express-session");
var bodyParser=require("body-parser");
var bcrypt=require("bcrypt-as-promised");
app.use(session({secret: 'codingdojorocks'}));
app.use(express.static(path.join(__dirname, "./static")));
app.set("views", path.join(__dirname, "./views"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended:true}));

var mongoose=require("mongoose");
mongoose.connect("mongodb://localhost/login_and_registration");
var UserSchema=new mongoose.Schema({
	email: {type: String, required: [true, "Email is required"], validate: {validator: function(email){
		return /^[a-zA-Z0-9.+_-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+$/.test(email);
	}, message: "Email must be valid"}, unique: true},
	first_name: {type: String, required: [true, "First Name is required"]},
	last_name: {type: String, required: [true, "Last Name is required"]},
	password: {type: String, required: [true, "Password is required"], minlength: [8, "Password must be at least 8 characters"]},
	birthday: {type: Date, required: [true, "Birthday is required"], validate: {validator: function(birthday){
		return birthday<=Date.now();
	}, message: "Birthday must be in the past"}}
});
UserSchema.pre("save", function(done){
	bcrypt.hash(this.password, 10).then(hashed_password => {
		this.password=hashed_password;
		done();
	}).catch(error =>{
		console.log(error);
		done();
	})
})

mongoose.model("User", UserSchema);
var User=mongoose.model("User");

app.get("/", function(req, res){
	res.render("index", {user: new User(), logerror: null, regerror: null});
});

app.get("/welcome", function(req, res){
	if(req.session.logged){
		User.findOne({_id: req.session.logged}, function(err, user){
			if(err){
				res.redirect("/");
			}else{
				res.render("welcome", {user: user});
			};
		});
	}else{
		res.redirect("/");
	};
});

app.post("/register", function(req, res){
	var user=new User(req.body);
	user.save(function(err){
		if(err){
			res.render("index", {user: user, logerror: null, regerror: err});
		}else{
			req.session.logged=user._id;
			res.redirect("/welcome");
		};
	});
});

app.post("/login", function(req, res){
	User.findOne({email: req.body.email}, function(err, user){
		if(err){
			res.render("index", {user: new User(), logerror: "Email and password do not match", regerror: null});
		}else{
			bcrypt.compare(req.body.password, user.password).then(function(){
				req.session.logged=user._id;
				res.redirect("/welcome");
			}, function(){
				res.render("index", {user: new User(), logerror: "Email and password do not match", regerror: null});
			})
		}
	})
});

app.get("/logout", function(req, res){
	req.session.destroy();
	res.redirect("/");
});

app.listen(6789, function(){
    console.log("listening on port 6789");
});