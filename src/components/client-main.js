import { useState } from "react";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import SpeechRecognition, { useSpeechRecognition } from "react-speech-recognition/lib/SpeechRecognition";
import { restUrl, deepStreamUrl } from "..";

let MeetingId = '';
let NetId = '';
let sendDataBool = true;
let record = null;
const { DeepstreamClient } = window.DeepstreamClient;
const client = new DeepstreamClient('localhost:6020');
// const client = new DeepstreamClient(deepStreamUrl);
client.login();

function ClientMain(){

    const location = useLocation();
    const [excited, setExcited] = useState('0.00');
    const [frustrated, setFrustrated] = useState('0.00');
    const [impolite, setImpolite] = useState('0.00');
    const [polite, setPolite] = useState('0.00');
    const [sad, setSad] = useState('0.00');
    const [satisfied, setSatisfied] = useState('0.00');
    const [sympathetic, setSympathetic] = useState('0.00');
    const [currentTranscript, setCurrentTranscipt] = useState("");
    const [meetingId, setMeetingId] = useState("");
    // const { DeepstreamClient } = window.DeepstreamClient;
    // const client = new DeepstreamClient(deepStreamUrl);
    // client.login();

    
    const instructionsPopupStyle = {
        backgroundColor: 'white',
        color: 'black',
        zIndex : '9',
        width : '125vh',
        height : '70vh',
        textAlign : 'left',
        padding : '2vh',
        overflowY: 'auto',
    };

    const finishButtonStyle = {
        backgroundColor: '#282c34',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        width: '99%',
        padding: '2vh',
    };

    const textareaStyle = {
        maxWidth: '99%',
        width: '99%',
    }

    const {
        transcript,
        resetTranscript,
    } = useSpeechRecognition();

    navigator.mediaDevices.getUserMedia({audio:true})

    function endMeeting(){
        sendDataBool = false;
        const url = restUrl + 'finish';
        fetch(url, {
            method: 'POST',
            mode: 'cors', 
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                'meetingId': MeetingId,
                'netId': NetId,
            }),
        })
        .then(response => {
            console.log('response', response);
            SpeechRecognition.stopListening();
        });
    }

    function sendData(netId, meetingId, transcript){
        try{
            if(transcript != ""){
                const url = restUrl + 'pollconversation';
                const text = transcript;
                setCurrentTranscipt(currentTranscript + (currentTranscript=="" ? "" : ". ") + text);
                resetTranscript();
                fetch(url, {
                    method: 'POST',
                    mode: 'cors', 
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        'text': text,
                        'netId': netId,
                        'meetingId': meetingId,
                        'timestamp': new Date().toISOString(),
                    }),
                })
                .then(response => {
                    if(response.status === 200){
                        response.json().then( response => {
                            setExcited(Math.round(response.emotions.excited).toFixed(2));
                            setFrustrated(Math.round(response.emotions.frustrated).toFixed(2));
                            setPolite(Math.round(response.emotions.polite).toFixed(2));
                            setImpolite(Math.round(response.emotions.impolite).toFixed(2));
                            setSad(Math.round(response.emotions.sad).toFixed(2));
                            setSatisfied(Math.round(response.emotions.satisfied).toFixed(2));
                            setSympathetic(Math.round(response.emotions.sympathetic).toFixed(2));
                        });
                    }
                    else{
                        throw new Error();
                    }
                });
            }
        }
        catch(error){
            console.log(error);
        }
        
    }

    useEffect(() => {
        const interval = setInterval(() => {
            NetId = location.state.netId;
            MeetingId = location.state.meetingId;
            setMeetingId(MeetingId);
            if(record == null){
                record = client.record.getRecord(location.state.meetingId);
                record.subscribe(location.state.netId, function(value) {
                    alert('Intervention: ' + value);
                }); 
                record.subscribe('endMeeting', function(value) {
                    if(value == 'true'){
                        endMeeting();
                    }
                })
            }
            if(sendDataBool){
                sendData(location.state.netId, location.state.meetingId, transcript);
            }
            else {
                // request for mic permissions
            }
        }, 7000);
        return () => clearInterval(interval);
    }, [location, transcript]);

    return(
        <div onLoadStart = {SpeechRecognition.startListening({continuous: true})} style={instructionsPopupStyle} id = 'clientMain'>
            {sendDataBool && <div>
                <center>
                    <h3>Now you are joining in a meeting</h3>
                    <h3>Meeting ID: {meetingId}</h3>
                    <textarea style={textareaStyle} rows = "10" value={currentTranscript}></textarea>
                    <h3>Your emotion is detected by the agent</h3>
                    <p>
                        Excited: {excited}, Frustrated: {frustrated}, Polite: {polite}, Impolite: {impolite}, Sad: {sad}, Satisfied: {satisfied}, Sympathetic: {sympathetic}
                    </p>
                    <button style={finishButtonStyle} onClick={() => {endMeeting();SpeechRecognition.stopListening();}}>End meeting</button>
                </center>
            </div>}
            {!sendDataBool && <div>
                <center>
                    <h3>The meeting has ended.</h3>
                </center>
            </div>}
        </div>
        );
    }
export default ClientMain;
        