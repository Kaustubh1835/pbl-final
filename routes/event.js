const { Router } = require("express");
const { z } = require("zod");
const { eventModel ,userModel } = require("./db");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");


require('dotenv').config();

const nodemailer = require("nodemailer");


// Gemini AI Configuration
const api_key = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(api_key);
const generationConfig = { temperature: 0.9, topP: 1, topK: 1, maxOutputTokens: 4096 };
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash", generationConfig });

const eventRouter = Router();

const authMiddleware = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ msg: "No token provided" });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, name, email, role }
    next();
  } catch (error) {
    res.status(401).json({ msg: "Invalid token" });
  }
};

// Existing routes...

eventRouter.post("/add", async function(req, res) {
  const eventSchema = z.object({
    title: z.string().min(1),
    date: z.string().min(1),
    location: z.string().min(1),
    description: z.string().min(1),
    capacity: z.number().int().min(1),
  });
  
  const { title, date, location, description, capacity } = req.body;
  
  const validation = eventSchema.safeParse({ title, date, location, description, capacity });
  
  if (!validation.success) {
    return res.status(400).json({
      msg: "Validation error",
      errors: validation.error.errors,
    });
  }
  
  try {
    await eventModel.create({
      title,
      date,
      location,
      description,
      capacity,
      participants: [],
    });
    res.json({
      msg: "Event created successfully",
    });
  } catch (error) {
    return res.status(500).json({
      msg: "Error creating event",
      error: error.message,
    });
  }
});

eventRouter.get("/get", async function(req, res) {
  try {
    const events = await eventModel.find();
    
    if (!events || events.length === 0) {
      return res.status(404).json({
        msg: "No events found",
      });
    }    res.status(200).json({
      msg: "Events retrieved successfully",
      events: events.map(event => ({
        id: event._id,
        title: event.title,
        date: event.date,
        location: event.location,
        description: event.description,
        capacity: event.capacity,
        participants: event.participants.map(p => ({
          id: p._id,
          name: p.name,
          email: p.email,
        })),
        averageRating: event.averageRating || 0,
        feedback: event.feedback || []
      })),
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error retrieving events",
      error: error.message,
    });
  }
});

eventRouter.delete("/delete/:id", async function(req, res) {
  const { id } = req.params;

  try {
    const deletedEvent = await eventModel.findByIdAndDelete(id);

    if (!deletedEvent) {
      return res.status(404).json({
        msg: "Event not found",
      });
    }

    res.status(200).json({
      msg: "Event deleted successfully",
      deletedEventId: id,
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error deleting event",
      error: error.message,
    });
  }
});

eventRouter.put("/update/:id", async function(req, res) {
  const { id } = req.params;
  const eventSchema = z.object({
    title: z.string().min(1),
    date: z.string().min(1),
    location: z.string().min(1),
    description: z.string().min(1),
    capacity: z.number().int().min(1),
  });

  const validation = eventSchema.safeParse(req.body);

  if (!validation.success) {
    return res.status(400).json({
      msg: "Validation error",
      errors: validation.error.errors,
    });
  }

  try {
    const updatedEvent = await eventModel.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedEvent) {
      return res.status(404).json({
        msg: "Event not found",
      });
    }

    res.status(200).json({
      msg: "Event updated successfully",
      event: {
        id: updatedEvent._id,
        title: updatedEvent.title,
        date: updatedEvent.date,
        location: updatedEvent.location,
        description: updatedEvent.description,
        capacity: updatedEvent.capacity,
        participants: updatedEvent.participants,
      },
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error updating event",
      error: error.message,
    });
  }
});
//kashu-notication
eventRouter.post("/:id/notify" , async (req, res)=>{

  
  let message = req.body.message;
  const users = await userModel.find({}, "email"); // gets only the emails
  const emailList = users.map(user => user.email);
  
  const transporter = nodemailer.createTransport({
    service : 'gmail',
    host: "smtp.gmail.com",
    port: 587,
    secure: false, // true for port 465, false for other ports
    auth: {
      user: process.env.User, //sender email add
      pass: process.env.App_Password, //app password from gmail account
    },
  });

    // send mail with defined transport object
    const mailOptions = ({
      from: {
        name : 'Event Organizer',
        address:  process.env.User
      }, // sender address
      to: emailList, // list of receivers
      subject: "Notification Regarding Event ", // Subject line
      text: message, // plain text body
      html:`<b>${message}</b>`, // html body
    });

    //sendmail
    const sendMail = async (transporter , mailOptions) =>{
      try{
        transporter.sendMail(mailOptions);
        console.log("mail send");
      }catch(err){
        console.log(err)
      }
    }
    sendMail(transporter , mailOptions);
})
eventRouter.post("/register/:id", authMiddleware, async function(req, res) {
  const { id } = req.params;
  const user = req.user;

  try {
    const event = await eventModel.findById(id);
    if (!event) {
      return res.status(404).json({
        msg: "Event not found",
      });
    }

    if (event.participants.length >= event.capacity) {
      return res.status(400).json({
        msg: "Event is at full capacity",
      });
    }

    if (event.participants.some(participant => participant._id.toString() === user.id)) {
      return res.status(400).json({
        msg: "User already registered",
      });
    }

    event.participants.push({ _id: user.id, name: user.name, email: user.email });
    await event.save();

    const newParticipant = event.participants[event.participants.length - 1];
    res.status(200).json({
      msg: "Participant registered successfully",
      eventId: id,
      participant: {
        id: newParticipant._id,
        name: newParticipant.name,
        email: newParticipant.email,
      },
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error registering participant",
      error: error.message,
    });
  }
});

// New route for generating event report
eventRouter.post("/report/:id", authMiddleware, async function(req, res) {
    const { id } = req.params;
  
    try {
      const event = await eventModel.findById(id);
      if (!event) {
        return res.status(404).json({
          msg: "Event not found",
        });
      }
  
      // Prepare event data
      const eventData = {
        title: event.title,
        date: new Date(event.date).toLocaleString(),
        location: event.location,
        description: event.description,
        capacity: event.capacity,
        participantsCount: event.participants.length,
        participants: event.participants.map(p => ({ name: p.name, email: p.email })),
        duration: req.body.duration || "Not specified",
        sponsoringOrganization: "Event Management Team",
        contactName: "Admin User",
        contactPhone: "123-456-7890",
        contactEmail: "admin@eventapp.com",
      };
  
      // Updated prompt to avoid Markdown and request plain text
      const prompt = `
        Generate a detailed Post-Event Summary Report for the following event as plain text, without using any formatting symbols like asterisks or bold markers. Use line breaks and indentation for structure.
  
        Post-Event Summary Report
  
        Event Details:
        Name of Event: ${eventData.title}
        Date of Event: ${eventData.date}
        Location of Event: ${eventData.location}
        Number of Persons Attending: ${eventData.participantsCount}
        Total Capacity: ${eventData.capacity}
        Sponsoring Organization(s): ${eventData.sponsoringOrganization}
        Contact Name: ${eventData.contactName}
        Telephone Number: ${eventData.contactPhone}
        E-mail: ${eventData.contactEmail}
  
        Event Summary:
  
        On ${eventData.date}, ${eventData.sponsoringOrganization} hosted the event "${eventData.title}" at ${eventData.location}. The event focused on ${eventData.description} and was attended by ${eventData.participantsCount} participants out of a total capacity of ${eventData.capacity}. The event lasted for ${eventData.duration}.
  
        Key Highlights:
        Participant Engagement: The event fostered active participation, with attendees sharing insights and ideas related to the event's objectives.
        Collaborative Discussion: A detailed discussion took place regarding objectives and outcomes.
        Attendee Feedback: The active participation suggests a positive level of engagement.
  
        
       
  
        Assessment and Actionable Outcomes:
  
        Summarize the event's success by highlighting its impact, participant satisfaction, and any actionable outcomes or future steps planned. Include recommendations based on the event data, such as improving attendance or defining clear objectives if applicable.
  
        Conclusion:
  
        Provide a concise conclusion summarizing the event's success and areas for improvement, ensuring the tone is professional and the structure follows the example of a formal event summary report.
      `;
  
      // Call Gemini AI to generate the report
      const result = await model.generateContent(prompt);
      const reportText = await result.response.text();
  
      res.status(200).json({
        msg: "Event report generated successfully",
        report: reportText,
      });
    } catch (error) {
      res.status(500).json({
        msg: "Error generating event report",
        error: error.message,
      });
    }  });

// New route for submitting event feedback
eventRouter.post("/:id/feedback", authMiddleware, async function(req, res) {
  const { id } = req.params;
  const { userId, rating } = req.body;
  
  // Validate rating
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({
      msg: "Rating must be between 1 and 5",
    });
  }

  try {
    // Find the event
    const event = await eventModel.findById(id);
    if (!event) {
      return res.status(404).json({
        msg: "Event not found",
      });
    }

    // Initialize feedback array if it doesn't exist
    if (!event.feedback) {
      event.feedback = [];
    }

    // Check if user already submitted feedback
    const existingFeedbackIndex = event.feedback.findIndex(
      f => f.userId.toString() === userId
    );

    if (existingFeedbackIndex >= 0) {
      // Update existing feedback
      event.feedback[existingFeedbackIndex].rating = rating;
    } else {
      // Add new feedback
      event.feedback.push({
        userId,
        rating,
        date: new Date()
      });
    }

    // Calculate average rating
    const totalRating = event.feedback.reduce((sum, item) => sum + item.rating, 0);
    const averageRating = (totalRating / event.feedback.length).toFixed(1);
    event.averageRating = parseFloat(averageRating);

    // Save the event with the new feedback
    await event.save();

    res.status(200).json({
      msg: "Feedback submitted successfully",
      eventId: id,
      averageRating: event.averageRating
    });
  } catch (error) {
    res.status(500).json({
      msg: "Error submitting feedback",
      error: error.message,
    });
  }
});

module.exports = {
  eventRouter,
};