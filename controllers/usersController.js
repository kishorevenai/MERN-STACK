const User = require('../model/User')
const Note = require('../model/Note')
const asyncHandler = require('express-async-handler')
const bcrypt = require('bcrypt')


const getAllUsers = asyncHandler(async (req, res) => {
    console.log('haiiii')
    const users = await User.find().select('-password').lean();
    if(!users.length) 
      return res.status(400).json({ message: 'No users found' })
    res.json(users)
})

const createNewUser = asyncHandler(async (req, res) => {
    const { username , password , roles } = req.body

    //Confirm data
    if(!username || !password || !Array.isArray(roles) || !roles.length) 
      return res.status(400).json({message:'All fields are required'})

    //Check for duplicate

    const duplicate = User.findOne({username}).lean().exec()

    if(duplicate) {
        return res.status(409).json({message: 'Duplicate username'})
    }

    const hashedPwd = await bcrypt.hash(password , 10)  //salt round

    const userObject = { username ,password:hashedPwd , roles }

    const user = await User.create(userObject)

    if(user) {
        res.status(201).json({message: `New user ${username} created`})
    }else {
        res.status(400).json({message: 'Invalid user data recieved'})
    }
}) 

const updateNewUser = asyncHandler(async (req, res) => {
    const {id, username , roles , active , password } = req.body

    //Confirm date
    if(!id || !username || !Array.isArray(roles) || !roles.length || typeof active !== 'boolean')  {
        return res.status(400).json({message:'All fields are required'})
    }

    const user = await User.findById(id).exec()

    if(!user) return res.status(400).json({message:'User not found'})

    const duplicate = await User.findOne({username}).lean().exec() 
    //All updates to the original user
    if(duplicate && duplicate?._id.toString() !== id) return res.status(409).json({message:'Duplicate username'})

     user.username = username
     user.roles = roles
     user.active = active

     if(password) {
        user.password = await bcrypt.hash(password , 10)
     }
     const updatedUsed = await user.save() 

     res.json({message:`${updatedUsed.username} updated`})
}) 

const deleteUser = asyncHandler(async (req, res) => {
    const { id } = req.body
    if(!id) {
        return res.status(400).json({message:'User ID required'})
    }

    const notes = await Note.findOne({user : id}).lean().exec()
    if(notes?.length) 
      return res.status(400).json({message:'User has assigned notes'})
    
    const  user = await User.findById(id).exec()

    if(!user) return res.status(400).json({message: 'User not found'})

    const  result = await user.deleteOne()
    const reply = `Username ${result.username} with ID ${result._id} deleted`


    res.json(reply)
}) 


module.exports = { getAllUsers , createNewUser , updateNewUser , deleteUser }