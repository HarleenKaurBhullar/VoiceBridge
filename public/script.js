const roomcode = document.getElementById('roomcode');
const startMeeting = document.getElementById('startMeeting');
const joinMeeting = document.getElementById('joinMeeting');
const code = document.getElementById('code');
const startMeetingButton = document.getElementById('startMeetingButton');
const joinroomid = document.getElementById('join-code');
const receiverroomcode = document.getElementById('receiver-roomcode');
const joinMeetingButton = document.getElementById('joinMeetingButton');
startMeeting.addEventListener('click', async () => {
    const roomid = await createRoom();
    if (!roomid) return;

    code.innerText = roomid;
    roomcode.style.display = 'block';
    receiverroomcode.style.display = 'none';
});

joinMeeting.addEventListener('click', () => {
    roomcode.style.display = 'none';
    receiverroomcode.style.display = 'block';
});

function checklanghost() {
    return { language1: document.getElementById('hostlanguage1').value, language2: document.getElementById('hostlanguage2').value };
}
function checklangmember() {
    return { language1: document.getElementById('memberlanguage1').value, language2: document.getElementById('memberlanguage2').value };
}
startMeetingButton.addEventListener('click', () => {
    const roomId = code.innerText;
    const selectedLanguage = checklanghost();

    if (roomId && selectedLanguage) {
        window.location.href = `./message.html?roomId=${roomId}&language1=${selectedLanguage.language1}&language2=${selectedLanguage.language2}`;
    }
});


joinMeetingButton.addEventListener('click', () => {
    
    const lang1=checklangmember().language1;
    const lang2=checklangmember().language2;
    if (joinroomid.value.trim() === '') {
    alert("Please enter room code");
    return;
}
    if (joinroomid.value.trim() !== '' && lang1 && lang2) {
        window.location.href = `./message.html?roomId=${joinroomid.value.trim()}&language1=${lang1}&language2=${lang2}`;
    }
});

async function createRoom() {
    try {
        const response = await fetch('http://localhost:5000/create-room');
        const data = await response.json();
        return data.code;
    } catch (err) {
        console.error(err);
        return null;
    }
}

