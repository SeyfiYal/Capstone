import React, { useContext, useState, useRef, useEffect } from 'react';
import '../styling/DashBoard.css';
import UserContext from './UserContext';
import Sidebar from './Sidebar';
import SettingsSidebar from './SettingsSidebar';
import Typewriter from 'typewriter-effect';

class ChatBot {
  intents = [


    ['hi|hello|hey|hey there', ['Hey there!', 'Hi! How can I assist you?']],
    ['how are you today?', ['I\m doing well what about you?']],
    ['i am good', ['Thats great to hear!', 'Awesome!', 'Glad to hear that!']],
    ['so tell me about yourself who are you?', ['I\'m ChatAI, AI Language model developed by Seyfi']],
    ['what can you do what are your skills?|what are your skills', ['I can chat with you and answer your questions!', 'I\'m here to help you with anything you need!', 'I\'m a chatbot, so I can chat with you about anything!']],
    ['can you do math?', ['Yes I am able to do some basic maths']],
    ['great', ['Thanks, Is there anything else i can help you with?']],
    ['no thank you', ['You\'re welcome! Don\'t hesitate to reach out if you need any help.']],
    
    
    ['what\'s up|sup|what\'s new', ['Not much, just chatting with you!', 'Just hanging out, how about you?', 'Nothing new, how about you?']],
    ['how are you|how\'s it going|how have you been', ['I\'m good, how about you?', 'I\'ve been doing alright, thanks for asking! How about you?']],
    
    ['bad|not good|not great', ['I\m sorry to hear that. Is there anything I can do to help?', 'I am here to chat if you need someone to talk to.']],
   
    ['hi|hello|hey|hey there', ['Hey there!', 'Hello!', 'Hi! How can I assist you?']],
    ['hi|hello|hey|hey there', ['Hey there!', 'Hello!', 'Hi! How can I assist you?']],
    ['hi|hello|hey|hey there', ['Hey there!', 'Hello!', 'Hi! How can I assist you?']],


    // --> Math Part <-- //
    ['help|assistance', ['Sure, I am here to help! What do you need assistance with?', 'How can I assist you today?', 'I qm ready to help. What do you need?']],
    ['what is (\\d+) \\+ (\\d+)\\?', [(match) => `${match[1]} + ${match[2]} = ${parseInt(match[1]) + parseInt(match[2])}`]],
    ['what is (\\d+) - (\\d+)\\?', [(match) => `${match[1]} - ${match[2]} = ${parseInt(match[1]) - parseInt(match[2])}`]],
    ['what is (\\d+) / (\\d+)\\?', [(match) => parseInt(match[2]) !== 0 ? ` ${match[1]} / ${match[2]} = ${parseInt(match[1]) / parseInt(match[2])}` : "Cannot divide by zero"]],
    ['what is (\\d+) x (\\d+)\\?', [(match) => `${match[1]} x ${match[2]} = ${parseInt(match[1]) * parseInt(match[2])}`]],
    ['.*', ['I\'m not sure what you mean, can you please rephrase that?', 'Sorry, I don\'t understand what you\'re asking!', 'I\'m not sure I know the answer to that!']],
    
  ];

  respond(userInput) {
    for (let i = 0; i < this.intents.length; i++) {
      let pattern = new RegExp(this.intents[i][0]);
      let match = pattern.exec(userInput);
      if (match) {
        let responses = this.intents[i][1];
        let response = (typeof responses[0] === 'function') ? responses[0](match) : responses[Math.floor(Math.random() * responses.length)];
        return { text: response, typing: true };
      }
    }
    return { text: "Sorry, I didn't understand that.", typing: true };
  }
}


function Dashboard() {


  function handleSettingsClick() {
    setIsSettingsOpen(!isSettingsOpen);
  }

  function handleSettingsUpdate(updatedSettings) {
    console.log('Updated Settings:', updatedSettings);
  }

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [userInput, setUserInput] = useState("");
  const [messages, setMessages] = useState([]);
  const chatbot = new ChatBot();
  const chatArea = useRef(null);
  const { userId } = useContext(UserContext);

  useEffect(() => {
    chatArea.current.scrollTop = chatArea.current.scrollHeight;
  }, [messages]);

  function sendMessage(e) {
    e.preventDefault();
    if (userInput.toLowerCase() === 'quit') {
      setMessages([
        ...messages,
        { text: 'THANKS FOR BEING HERE', sender: 'Over-Lord' },
      ]);
    } else {
      fetch('http://localhost:5555/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: userInput,
        }),
        credentials: 'include',
      })
        .then((response) => response.json())
        .then((data) => {
          let botResponse = chatbot.respond(userInput);
          setMessages([
            ...messages,
            { text: userInput, sender: 'Human' },
            { text: botResponse.text, sender: 'Over-Lord', typing: botResponse.typing },
          ]);

          fetch('http://localhost:5555/responses', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              response_content: botResponse.text,
              message_id: data.id,
            }),
            credentials: 'include',
          })
          .catch((error) => {
            console.error('Error:', error);
          });
        })
        .catch((error) => {
          console.error('Error:', error);
        });
    }
    setUserInput("");
  }

  useEffect(() => {
    fetch(`http://localhost:5555/past_messages/${userId}`, {
      method: 'GET',
      credentials: 'include',
    })
      .then((response) => response.json())
      .then((data) => {
        const { messages, responses } = data;
        const chatMessages = [];
        
        for (let i = 0; i < messages.length; i++) {
          chatMessages.push({ text: messages[i].content, sender: 'Human' });
          if (responses[i]) {
            chatMessages.push({ text: responses[i].response_content, sender: 'Over-Lord' });
          }
        }
        
        setMessages(chatMessages);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, []);

  function handleInputChange(e) {
    setUserInput(e.target.value);
  }

  return (
    
    <div className="front-page">
      <Sidebar onSettingsClick={handleSettingsClick} />
      {isSettingsOpen && <SettingsSidebar onSettingsUpdate={handleSettingsUpdate} />}
      <div id="main" className="chat-box">
        <div className="chat-area" ref={chatArea}>
          {messages.map((message, index) => (
            <div key={index} className={`${message.sender}-msg ${message.sender === 'Over-Lord' ? 'overlord-msg-response' : ''}`}>
              <p><strong>{message.sender}: </strong> 
                {message.typing ? (
                  <Typewriter
                    options={{
                      delay: 25, // This is the typing speed in milliseconds.
                    }}
                    onInit={(typewriter) => {
                      typewriter
                        .typeString(message.text)
                        .start();
                    }}
                  />
                ) : message.text}
              </p>
            </div>
          ))}
        </div>
        <form onSubmit={sendMessage}>
          <input type="text" value={userInput} onChange={handleInputChange} className="chat-input" />
        </form>
      </div>
    </div>

  );
}

export default Dashboard;
