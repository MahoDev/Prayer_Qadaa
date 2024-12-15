
## How to setup and start the project locally
First, ensure you have node and python installed.

**For the Next.js project:**

Install npm dependencies:
```
npm install 
```

1- Go to Firebase console, create a new project and add a web app.

2- Copy the config values and paste them next to the appropriate environemnt variable in the .env file.

3- In firebase console, Go to project settings => Cloud Messaging => Generate key pair.
Copy the private and public keys and place them in appropriate places in .env file.
 
4- Go to project settings => Service accounts => generate new private key and store the downloaded file as "serviceAccountKey.json" in root of the project.

5- Enable authentication, and allow Google and Email/password providers.

6- Enable firestore, and create the collections:
* users
* missedPrayer
* qadaaPlans
* scheduledReminders
* completedPrayers

5- Run the server hosting the cronjob for the Qadaa Plans reminders:
```
node server.js
```

6- Run the server for the UI:
```
npm run dev
```

The site should be working now for the most part.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

**For the Python backend**

1- Open "model_api" directory in code editor.

2- Create a virtual environemnt:
```
pip install virtualenv
python -m venv randomName
source env/bin/activate
```

3- Install all the dependencies:
```
pip install -r requirements.txt
```
4- Run server
```
python app.py
```


## Credits:
Favicon from flaticon.com