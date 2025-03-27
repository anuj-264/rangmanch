import mongoose, { Schema } from 'mongoose';
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';


const videoSchema = new Schema({
    title: {
        type: String,
        required: true,
        trim: true,
        minlength: [10, 'Title must be at least 5 characters long'],
    },
    description: {
        type: String,
        required: true,
        trim: true,
        minlength: [20, 'Description must be at least 20 characters long'],
    },
    videoFile: { //cloudinary
        type: String,
        required: true,
        
    },
    thumbnail: {
        type: String,
        required: true,
    },
    duration: {
        type: Number, //cloudinary
        required: true,
    },
    views: {
        type: Number,
        default: 0
    },
   
    isPublished: {
        type: Boolean,
        default: true
    },
    owner: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },

},

{ timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);
export const Video = mongoose.model('Video', videoSchema);