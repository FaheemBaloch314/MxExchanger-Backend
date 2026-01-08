# MxExchanger-Backend

MXExchanger is a **MERN-based backend** for a currency exchange platform.  
It allows users to convert **PKR to USD** and **USD to PKR** with **automatic tax calculation**.  
Users can **deposit, withdraw, and send money** securely using **unique account numbers**.

---

## 💻 Features

- Convert **PKR ⇄ USD** automatically  
- Automatic tax calculation on each transaction  
- Deposit and withdraw money  
- Send money to other users via **account number**  
- User authentication with **JWT**  
- Transaction history management  
- Secure RESTful API endpoints  

---

## ⚙️ Configuration

Create a file `config/config.env` in the project root with the following content:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017
JWT_SECRET=KALSDklasdlasdf
EXPIRES_IN=80
SMTP_MAIL=youremail@mail.com
SMTP_PASSWORD="Your Password"
