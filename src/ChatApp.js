import React, { useState, useRef } from 'react';
import './ChatApp.css'
import { Button, Input, Box } from '@chakra-ui/react';
import { AttachmentIcon } from '@chakra-ui/icons'
import ReactMarkdown from 'react-markdown'
import { WrapItem, Avatar } from '@chakra-ui/react';


function ChatApp() {
  const [messages, setMessages] = useState([
    { role: "system", content: "Eres un asistente de Ventas" },
  ]);
  const [inputText, setInputText] = useState("");
  const [isAssistantTyping, setIsAssistantTyping] = useState(false);


  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);
  const [tagName, setTagName] = useState(false); // Agrega el estado para tagName


  const predictionKey = '96edfdca1da34aadb1600072b14105e9';
  const predictionEndpoint = 'https://eastus.api.cognitive.microsoft.com/customvision/v3.0/Prediction/c3dc1a8b-87ef-44b1-85db-ad1779dc7a95/classify/iterations/Iteration2/image';

  const handleSendMessage = async () => {
    if (inputText.trim() === "") return;

    console.log(selectedFile);

    let tagName = ""; // Variable para almacenar el tagName


    if (selectedFile) {
      const headers = new Headers();
      headers.append('Prediction-Key', predictionKey);
      headers.append('Content-Type', 'application/octet-stream');


      const response = await fetch(predictionEndpoint, {
        method: 'POST',
        headers: headers,
        body: selectedFile,
      });

      const predictionData = await response.json();

      // Acceder al primer elemento del array "predictions"
      const firstPrediction = predictionData.predictions[0];

      // Acceder al valor de la propiedad "tagName"
      tagName = firstPrediction.tagName;

      setTagName(true)

    }

    // Agregar el tagName al inputText si está definido
    const modifiedInputText = tagName ? `${inputText}  ${tagName}` : inputText;
    console.log(modifiedInputText)
    const userMessage = { role: "user", content: modifiedInputText };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText("");

    setIsAssistantTyping(true); // Activar la indicación de escritura


    


    const requestBody = {

      messages: newMessages,
      max_tokens: 800,
      temperature: 0,
      frequency_penalty: 0,
      presence_penalty: 0,
      top_p: 1,
      stop: null,
      dataSources: [
        {
          type: "AzureCognitiveSearch",
          parameters: {
            endpoint: "https://searchgtp.search.windows.net",
            key: "nBb6Kkw5HsTaf6CVil56RuPWX6oxOe3JFF5Yvs0cmKAzSeBHGwJE",
            indexName: "azuresql-index"
          }
        }
      ]

    };



    const response = await fetch(
      "https://gptmodelproducto.openai.azure.com/openai/deployments/gptchatproduct/extensions/chat/completions?api-version=2023-06-01-preview",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": "0f0673910b9546e8bbe6256a6f00f08e",
        },
        body: JSON.stringify(requestBody),
      }
    );

    const responseData = await response.json();


    const assistantMessage = responseData.choices[0].messages[1].content;
    console.log("------------------------------")
     console.log(JSON.stringify(responseData))
     console.log("------------------------------")

     if(assistantMessage.includes("The requested information is not available in the retrieved data. Please try another query or topic.")){


      console.log("Entro en error") 
      console.log(JSON.stringify(responseData))

      const assistantResponse = { role: "assistant", content:  responseData.choices[0].messages[0].content};
      setMessages([...newMessages, assistantResponse]);
 
     }if (assistantMessage.includes('lista')) {
      console.log("entro en listas")
      const assistantResponse = { role: "assistant", content: responseData.choices[0].messages[1].content  };
      setMessages([...newMessages, assistantResponse]);
     }
     else{
      console.log("Normal entro")

      console.log(JSON.stringify(responseData)) 

      const assistantResponse = { role: "assistant", content: assistantMessage };
      setMessages([...newMessages, assistantResponse]);
     }


    setTagName(false)

    setIsAssistantTyping(false); // Desactivar la indicación de escritura

    setSelectedFile(null); // Restablecer el valor del archivo seleccionado a null


  };

  const handleFileChange = (e) => {
    setSelectedFile(e.target.files[0]);
  };
  // Personaliza el renderizado del código para aplicar estilos
  const renderers = {
    code: ({ language, value }) => (
      <pre style={{ backgroundColor: '#f5f5f5', padding: '10px', borderRadius: '5px' }}>
        <code style={{ color: '#333' }}>{value}</code>
      </pre>
    ),
  };


  // Dentro del componente ChatApp
  const handleClearChat = () => {
    setMessages([]); // Limpia el historial de mensajes
  };
  return (
    <div>
      <div className="chat-window">
        {messages.map((message, index) => (

          <WrapItem key={index} className={`message ${message.role}`}>
            {message.role === "user" ? (
              <Avatar className='Youicon' src='you.jpeg' />
            ) : (
              <Avatar name='Ryan Florence' src='https://bit.ly/ryan-florence' />
            )}
            <Box className="message-content">
              <ReactMarkdown renderers={renderers}>
                {message.role === "user" && tagName
                  ? message.content.split(" ").slice(0, -2).join(" ") // Elimina la última palabra
                  : message.content}
              </ReactMarkdown>
            </Box>
          </WrapItem>

        ))}

        {isAssistantTyping && <div className="typing-indicator">Assistant is typing...</div>}

      </div>
      <Box>
        <Button colorScheme="red" variant="ghost" onClick={handleClearChat}>
          Clear Chat
        </Button>
        <Input
          isInvalid
          errorBorderColor='teal.300'
          m='20px'
          w='50%'
          size='lg'
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your message..."
        />

        <Button colorScheme='teal' variant='ghost' onClick={handleSendMessage}>Send</Button>
        <Button
          colorScheme='teal'
          variant='ghost'
          onClick={() => fileInputRef.current.click()}
          rightIcon={<AttachmentIcon />}
        >

          {selectedFile && <p> {selectedFile.name}</p>}

        </Button>

        <input
          ref={fileInputRef}
          type='file'
          style={{ display: 'none' }}
          onChange={handleFileChange}
        />

      </Box>
    </div>
  );
}

export default ChatApp;

