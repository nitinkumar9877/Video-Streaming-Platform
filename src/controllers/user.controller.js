import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js" 
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose";


const generateAccessAndRefreshToken=async(userId)=>{
   try {
     const user=await User.findById(userId)
     const accessToken=user.generateAccessToken()
     const refreshToken=user.generateRefreshToken()


    user.refreshToken=refreshToken
    await user.save({ validateBeforeSave:false })

    return {accessToken,refreshToken}

   } catch (error) {
      throw new ApiError(500,"Something went wrong while generating refresh and access token")
   }
}


const registerUser=asyncHandler(async (req,res)=>{
    // res.status(200).json({message:"ok"})
    
    //1 Get user details from frontEnd
    //2 validation-not empty
    //3 check if user already exists: username,email
    //4 check for images,check for avatar
    //5 upload them to cloudinary,avatar check
    //6 create user object-create entry in db
    //7 remove password and refresh token field from response
    //8 check for user creation
    //9 return response

    const {fullName,email,userName,password}=req.body
    //console.log("email: ",email);

    if([fullName,email,userName,password].some((field)=>field?.trim()===""))
    {
       throw new ApiError(400,"All fields are required")
    }
    
    // if(fullName==="")
    // {
    //     throw new ApiError(400,"Full Name is Required")
    // }

    const existedUser=await User.findOne({
        $or:[{ userName },{ email }]
    })

    if(existedUser)
    {
        throw new ApiError(409,"User with username or email already exists")
    }
    //console.log(req.files);
    
   const avatarLocalPath= req.files?.avatar[0]?.path
   //const coverImageLocalPath= req.files?.coverImage[0]?.path
   let coverImageLocalPath;
   if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0)
   {
    coverImageLocalPath=req.files.coverImage[0].path;
   }

  if(!avatarLocalPath)
  {
    throw new ApiError(400,"Avatar file is required")
  }
  const avatar=await uploadOnCloudinary(avatarLocalPath)
  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar)
  {
    throw new ApiError(400,"Avatar file is required")
  }

  const user=await User.create({
    fullName,
    avatar:avatar.url,
    coverImage: coverImage?.url || "",
    email,
    password,
    userName:userName.toLowerCase()
  })

  const createdUser=await User.findById(user._id).select(
    "-password -refreshToken"
  )

  if(!createdUser)
  {
    throw new ApiError(500,"Something went wrong while registering the user")
  }
  return res.status(201).json(
    new ApiResponse(200,createdUser,"User registered successfully")
  )


})

const loginUser=asyncHandler(async (req,res)=>{
    //req body->data
    //username or email
    //find the user
    //password check
    //access and refresh token
    //send cookie

    const {email,userName,password}=req.body

    if(!userName && !email)
    {
      throw new ApiError(400,"username or email is required")
    }

   const user=await User.findOne({
    $or:[{userName},{email}]
   })

   if(!user)
   {
    throw new ApiError(404,"User does not exists")
   }

   const isPasswordValid=await user.isPasswordCorrect(password)
   if(!isPasswordValid)
    {
     throw new ApiError(401,"Invalid user credentials")
    }

    const{accessToken,refreshToken}=await generateAccessAndRefreshToken(user._id)

    const loggedInUser=await User.findById(user._id).select("-password -refreshToken")

    const options={
      httpOnly:true,
      secure:true,
    }

    return res.status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,accessToken,refreshToken
        },
        "User logged in successfully"
    )
    )
})


const logoutUser=asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(req.user._id,
      {
        $unset:{refreshToken:1
          //this removes the field form document
        }
      },{
        new:true
      }
    )


    const options={
      httpOnly:true,
      secure:true,
    }

    return res.status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
      new ApiResponse(200,{},"User logged Out")
    )
})

const refreshAccessToken=asyncHandler(async(req,res)=>{
  const incomingRefreshToken=req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken)
  {
    throw new ApiError(401,"Unauthorized requests")
  }
  try {
    const decodedToken=jwt.verify(incomingRefreshToken,process.env.REFRESH_TOKEN_SECRET)
    
  
     const user=await User.findById(decodedToken?._id)
     if(!user)
      {
        throw new ApiError(401,"Invalid refresh token")
      }
  
  
      if(incomingRefreshToken!==user?.refreshToken)
      {
        throw new ApiError(400,"Refresh token is expired or used")
      }
  
      const options={
        httpOnly:true,
        secure:true,
      }
  
     const {accessToken,newRefreshToken}= await generateAccessAndRefreshToken(user?._id)
  
      return res.status(200)
      .cookie("accessToken",accessToken,options)
      .cookie("refreshToken",newRefreshToken,options)
      .json(
        new ApiResponse(
          200,
          {accessToken,refreshToken:newRefreshToken},
          "Access token refreshed"
        )
      )
  } catch (error) {
    throw new ApiError(401,error?.message || "Invalid refresh token")
  }
})

const changeCurrentPassword=asyncHandler(async(req,res)=>{
   const {oldPassword,newPasword}=req.body;

   const user=await User.findById(req.user?._id)
   const isPasswordCorrect=await user.isPasswordCorrect(oldPassword)

   if(!isPasswordCorrect)
   {
    throw new ApiError(400,"Invalid old password")
   }

   user.password=newPasword
   await user.save({validateBeforeSave:false})

   return res.status(200)
   .json(new ApiResponse(200,{},"Password changed successfully"))
})

const getCurrentUser=asyncHandler(async(req,res)=>{
  return res.status(200)
  .json(
    new ApiResponse(200,req.user,"current user fetched successfully")
  )
})

const updateAccountDetails=asyncHandler(async(req,res)=>{
    const {fullName,email}=req.body

    if(!fullName && !email)
    {
      throw new ApiError(400,"All fields are required")
    }

    const user=await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set:{
          fullName,
          email:email
        }
      },
      {new:true}
    ).select("-password")


    return res.status(200)
    .json(new ApiResponse(200,user,"Account details updated successfully"))
})

const updateUserAvatar=asyncHandler(async(req,res)=>{
  const avatarLocalPath=req.file?.path

  if(!avatarLocalPath)
  {
    throw new ApiError(400,"Avatar file is missing")
  }
  const avatar=await uploadOnCloudinary(avatarLocalPath)

  if(!avatar.url)
  {
    throw new ApiError(500,"Error while uploading avatar")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
          avatar:avatar.url
        }
    },
    {
      new:true
    }
  ).select("-password")
   

  return res.status(200)
  .json(
    new ApiResponse(200,user,"Avatar updated successfully")
  )


})
const updateUserCoverImage=asyncHandler(async(req,res)=>{
  const coverImageLocalPath=req.file?.path

  if(!coverImageLocalPath)
  {
    throw new ApiError(400,"Cover Image file is missing")
  }
  const coverImage=await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImageLocalPath.url)
  {
    throw new ApiError(500,"Error while uploading cover image")
  }

  const user=await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set:{
          coverImage:coverImage.url
        }
    },
    {
      new:true
    }
  ).select("-password")

  return res.status(200)
  .json(
    new ApiResponse(200,user,"Cover image updated successfully")
  )

})


const getUserChannelProfile = asyncHandler(async (req,res)=>{
  const {userName} = req.params
  if (!userName?.trim()) {
      throw new ApiError(400,"username is missing")
  }
  // const user = await User.find({username}) --1 way of below
  // channel is an array (of 1 size) --> [{}]
  const channel = await User.aggregate(
      [
          {
              $match : {
                  userName : userName?.toLowerCase() //? optional
              }
          },
          {
              $lookup : {
                  from : "subscriptions",
                  localField : "_id",
                  foreignField : "channel",
                  as : "subscribers"
              }
          },
          {
              $lookup : {
                  from : "subscriptions",
                  localField : "_id",
                  foreignField : "subscriber",
                  as : "subscribedTo"
              }
          },
          {
              $addFields : {
                  subscribersCount : {
                      $size : "$subscribers"
                  },
                  channelsSubscribedTo : {
                      $size : "$subscribedTo"
                  },
                  isSubscribed : {
                      $cond : {
                          if: {$in: [req.user?._id,"$subscribers.subscriber"]}, //in can see inside both array and object (subscribers.subscriber ki id === logged in user ki id then the person sending the req is subscribed to the channel he is watching)
                          then : true,
                          else : false
                      }
                  }
              }
          },
          {
              $project : {
                  fullName : 1,
                  userName : 1,
                  subscribersCount : 1,
                  channelsSubscribedTo : 1,
                  isSubscribed : 1,
                  avatar : 1,
                  coverImage : 1,
                  email : 1
              }
          }
      ]
  ) 

  if (!channel?.length) {
      throw new ApiError(404, "channel does not exist")
  }

  return res
  .status(200)
  .json(
      new ApiResponse(200,channel[0],"user channel fetched successfully")
  )
})   

const getWatchHistory = asyncHandler(async (req,res)=>{
  // console.log("This Line is working");
  const user = await User.aggregate(
      [
         {            
              $match : {
                  _id : new mongoose.Types.ObjectId(req.user._id) //req.user_id gives you a literal string
              }
          },
          {
              $lookup : {
                  from : "videos",
                  localField : "watchHistoy",
                  foreignField : "_id",
                  as : "watchHistoy" , //now there are many docs inside watchHistory
                  pipeline : [
                      {
                          $lookup : {
                              from : "users",
                              localField : "owner",
                              foreignField : "_id",
                              as : "owner",
                              pipeline : [
                                  {
                                      $project : {
                                          fullName : 1,
                                          userName : 1,
                                          avatar : 1
                                      }
                                  },
                                  {
                                      $addFields : {
                                          owner : {
                                              $first : "$owner"
                                          } 
                                      }
                                  }
                              ]                              
                          }
                      }
                  ]
              }
          }
      ]
  )

  return res
  .status(200)
  .json(
      new ApiResponse(
          200,
          user[0].watchHistoy,
          "Watch history fetched successfully"
      )
  )
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
}