# FriendFinder

## ​Find Your Most Compatible Match
​FriendFinder is a full-stack web application that pairs users based on their responses to a personality survey. It uses a custom matching algorithm to compare user scores and find the individual with the lowest total difference in responses.

## Features
- ​Interactive Survey: A 10-question survey using a 5-point Likert scale (Strongly Disagree to Strongly Agree).
- ​Real-time Matching: An algorithm that calculates compatibility instantly upon submission.
- ​Responsive UI: Built with Bootstrap to ensure the experience is seamless on mobile, tablet, and desktop.
- ​RESTful API: Provides endpoints to view the complete list of potential friends and add new ones.

## Tech Stack
​Frontend: HTML5, CSS3, Bootstrap, jQuery. 
Backend: Node.js, Express.js  
​Deployment: Heroku
​
## The Matching Logic
​Compatibility is determined by calculating the Total Difference between the current user’s scores and every user currently stored in the database.  
​Each answer is converted into an integer (1 to 5).  
​The absolute difference for each question is calculated: |UserA_q - UserB_q|.  
​The differences are summed into a total score.  
​The person with the lowest total difference is returned as the "Best Match.". 

## Installation & Setup
To run this project locally, follow these steps:
1. Clone the repository
```
git clone https://github.com/dka-y/friend-search.git
```
2. Navigate to the directory
```
cd friend-search
```
3. Install the dependencies
```
npm install
```
4. Start the server
```
node server.js
```
5. Open the it in your browser  
Navigate to 'http://localhost:8080'

## Project Structure
```

```
