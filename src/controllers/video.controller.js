import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import mongoose from "mongoose"



const getAllVideos=asyncHandler(async(req,res)=>{
    const{page=1,limit=10,query,sortBy,sortType,userId}=req.query
     
    const pipeline=[];
    /*fetching all videos which have keywords described int the query it find all the videos matching title and description
     it uses a relevence score TF-IDF score to match 
    */
    if(query)
    {
        pipeline.push(
            {
                $search:{
                    index:"search-videos",
                    text:{
                        query:query,
                        path:["title","description"],
                    },
                },
            }
        );
    }
    
    //Checking userID
    if(userId)
    {
        if(!mongoose.Types.ObjectId.isValid(userId))
        {
            throw new ApiError(400,"Invalid User");
        }
    }

    //only fetching videos for owner whoose userId matches
    pipeline.push(
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
            }
        }
    )
    
    //only fetching published videos
    pipeline.push(
        {
            $match:{
                isPublished:true,
            }
        }
    )

    //sorting on the basis on any field and also whetehr asc or desc
    if (sortBy && (sortType === "asc" || sortType === "desc")) {
        pipeline.push({
          $sort: {
            [sortBy]: sortType === "asc" ? 1 : -1,
          },
        });
      } else {
        pipeline.push({ $sort: { createdAt: -1 } });
      }

      /*LookUp owner deatils- displaying userName and avatar corresponding to every video and also unwinding it or 
      destructuring the array of video documents returned by pipline to be able to pass as a json-object in APIResponse
      */
      pipeline.push(
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "ownerDetails",
            pipeline: [
              {
                $project: {
                  userName: 1,
                  "avatar.url": 1,
                },
              },
            ],
          },
        },
        {
          $unwind: "$ownerDetails",
        }
      );
      
      //Pagination handling
      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const limitInt = parseInt(limit, 10);
      pipeline.push({ $skip: skip });
      pipeline.push({ $limit: limitInt });



    //Giving all videos with pagination information in form of APIResponse
    try {
        const videos = await Video.aggregate(pipeline);
        const totalVideos = await Video.countDocuments({ isPublished: true });
    
        const totalPages = Math.ceil(totalVideos / limitInt);
    
        return res.status(200).json(
          new ApiResponse(200, {
            videos,
            pagination: {
              totalVideos,
              totalPages,
              currentPage: parseInt(page, 10),
              limit: limitInt,
            },
          }, "Videos fetched successfully")
        );
      } catch (error) {
        console.error("Error fetching videos:", error);
        throw new ApiError(500, "An error occurred while fetching videos");
      }
})

const publishAVideo=asyncHandler(async(req,res)=>{


     // get video, upload to cloudinary, create video
    //req.user - user , check if there or not 
    //title , description , check if there not 
    //upload file on multer , check if there not 
    //local path from multer and upload it on cloudinary 
    //find video length etc from cloudinary 
    //if there is anything in is public then also update that 
    try {
      const { title, description } = req.body
       
      //checks if videoFile or thumbnail is missing
      //multer adds a field ".files" in req which helps us to upload video or images
      if(!req.files.videoFile || !req.files.thumbnail){
         if(req.files.videoFile){
             fs.unlinkSync(req.files?.videoFile[0]?.path)  //removing the videoFile from local server to save disk space and ensure security
         }
         if(req.files.thumbnail){
             fs.unlinkSync(req.files?.thumbnail[0]?.path)  ////removing the videoFile from local server to save disk space and ensure security
         }
         throw new ApiError(401,"either videoFile or thumbnail is missing");
      }

      //cloudinary adds field videoFile and thumbnail so that we can access its path and show on our frontend
      const videoFileLocalPath = req.files?.videoFile[0]?.path;
      const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
      //check if title or description is missing
      if(!title || !description){
         if(videoFileLocalPath){
             fs.unlinkSync(videoFileLocalPath)
         }
         if(thumbnailLocalPath){
             fs.unlinkSync(thumbnailLocalPath)
         }
         throw new ApiError(401,"cannot publish video without title and description");
      }
      

      //".user" added by authorization middleware
      const ownerId = req.user?._id ;
      if(!ownerId) throw new ApiError(401,"user not loggedin");
      

      //uploading files to cloudinary
      const videoFile = await uploadOnCloudinary(videoFileLocalPath);
      const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
     
      if(!thumbnail || !videoFile) throw new ApiError(500,"uploading error when uploading either video or thumbnail to cloudinary") ;
      
      //creating a new video document in mongoDB with owner=user.id
      const video = await Video.create({
          videoFile:videoFile.secure_url ,
          //videoFilePublicId:videoFile.public_id,
          thumbnail:thumbnail.secure_url ,
         // thumbnailPublicId:thumbnail.public_id,
          owner:ownerId,
          title,
          description,
          duration:videoFile.duration ,
          isPublished:req.body.isPublic == "false" ? false : true
         
      })
      return res
      .status(201)
      .json(
          new ApiResponse(201,video,"video is published")
      )     
    } catch (error) {
      res
      .status(error?.statusCode||500)
      .json({
         status:error?.statusCode||500,
         message:error?.message||"some error in publishing video"
      })
    }
 
   
})

const getVideoById=asyncHandler(async(req,res)=>{
    
  try {
    // this is for getting video info and displaying it in card if its not there 
  const { videoId } = req.params
  // get video by id

  if(!videoId) throw new ApiError(400,"videoId missing");
  
  //To fetch that particular video
  const video = await Video.findOne({
      _id: new mongoose.Types.ObjectId(videoId)
  })
 
  // can update this so that owner can only see through id
  if(!video || !video?.isPublished) throw new ApiError(400,`video with this ${videoId} is not available`)

    res.status(200)
    .json(new ApiResponse(200,video,"got video from id"))
  } catch (error) {
  res
  .status(error?.statusCode||500)
  .json({
      status:error?.statusCode||500,
      message:error?.message||"some error in getting video by id"
  })
  }
})

const updateVideo=asyncHandler(async(req,res)=>{
  try {
    const { videoId } = req.params
    // update video details like title, description, thumbnail
    if(!videoId) throw new ApiError(400,"videoId missing");
    
    const {title,description} = req.body ;
    const thumbnailLocalPath = req.file?.path;
    if(!title && !description && !thumbnailLocalPath)
    throw new ApiError(400,"either send updated title ,description or thumbnail");
    
    const userId = req.user._id;
    if(!userId) throw new ApiError(400,"user not logged in");

    const video = await Video.findById(videoId);

    if(!video) throw new ApiError(400,"video with this videoId is missing")
    const ownerId = video?.owner;
    const permission = JSON.stringify(ownerId) == JSON.stringify(userId);  //if directly use it will give false they both are different objects in memory

    if(!permission) throw new ApiError(400,"login with owner id");
    
    if(thumbnailLocalPath){ 
        var thumbnail = await uploadOnCloudinary(thumbnailLocalPath);  //uploading new thumbnail on cloudinary
    }
    
    /*Creating a new object with updated details so that it can be direclty passed to mongoDB to update the existing details 
        of a particular video
    */
    const updatedObj = {};
    if(title) updatedObj.title = title;
    if(description) updatedObj.description = description;
    if(thumbnailLocalPath) {
       updatedObj.thumbnail = thumbnail.secure_url ;
    }
    
   
    const updatedVideo = await Video.findByIdAndUpdate(
        new mongoose.Types.ObjectId(videoId),
        updatedObj,
        {
            new:true                   //return the new updated object or mongoDB document
        }
    )

    res.status(200)
    .json( 
        new ApiResponse(200,updatedVideo,"video updated successFully")
    ) ;

  } catch (error) {
    
   res
   .status(error?.statusCode||500)
   .json({
      status:error?.statusCode||500,
      message:error?.message||"some error in updating the video"
   })

  }
})

const deleteVideo=asyncHandler(async(req,res)=>{
  try {
    const { videoId } = req.params
    
    if(!videoId) throw new ApiError(400,"videoId missing");
    
    if(!req.user) throw new ApiError(400,"user not loggedIn");
 
    const userId = req.user._id;
    const video = await Video.findById(videoId);
    if(!video) throw new ApiError(400,"video with this videoId is missing")
    const ownerId = video?.owner;
    // console.log(new String(userId));
    // console.log(JSON.stringify(ownerId));
 
    if(JSON.stringify(ownerId) !== JSON.stringify(userId)) throw new ApiError(400,"login with owner id")
 
    const deleted = await Video.findByIdAndDelete(new mongoose.Types.ObjectId(videoId));
    
   // console.log(deleted)
 
    return res
    .status(200)
    .json(
        new ApiResponse(200,{info:`video : ${video.title} is deleted`},"video deleted successFully")
    )
  } catch (error) {
   res
   .status(error?.statusCode||500)
   .json({
      status:error?.statusCode||500,
      message:error?.message||"some error in deleting a video"
   })
  }
})


export{
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
}