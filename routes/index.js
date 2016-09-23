
/*
 * GET home page.
 */
var __home = "/home/vid/role_call/";

exports.index = function(req, res){
  res.sendFile(__home + '/program.html');
};
exports.control = function(req, res){
  res.sendFile(__home + '/control.html');
};
exports.parts = function(req, res){
  res.sendFile(__home + '/parts.html');
};
//exports.test = function(req, res){
//  res.sendFile(__home + '/newprogram.html');
//};
//exports.login = function(req, res){
//  res.sendFile(__home + '/login.html');
//};
//exports.logout = function(req, res) {
//  res.redirect('/login');
//};