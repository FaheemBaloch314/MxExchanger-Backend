# MxExchanger-Backend

MXExchanger is a **MERN-based backend** for a currency exchange platform.  
It allows users to convert **PKR to USD** and **USD to PKR** with **automatic tax calculation**.  
Users can **deposit, withdraw, and send money** securely using **unique account numbers**.

---

## 💻 Features

- PKR ⇄ USD currency conversion  
- Automatic tax calculation on every transaction  
- Deposit and withdraw money  
- Internal money transfer using unique account numbers  
- User authentication with JWT  
- Transaction history management  
- Secure API endpoints

---

## ⚙️ Configuration

Create a `config/config.env` file in the project root and add the following:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017
JWT_SECRET= YOUR SECRET KEY
EXPIRES_IN=80
SMTP_MAIL=youremail@mail.com
SMTP_PASSWORD="Your Password"


## Installation & Running

git clone git@github.com:FaheemBaloch314/MxExchanger-Backend.git
cd MxExchanger-Backend

npm install
npm run dev
