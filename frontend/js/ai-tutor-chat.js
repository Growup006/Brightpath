var chatHistory=[];

var isTyping=false;

function addBotMessage(text){
  var msgs=document.getElementById('chat-messages');
  var div=document.createElement('div');div.className='msg ai';
  var parsed=parseMessage(text);
  div.innerHTML='<div class="msg-avatar">🤖</div><div class="msg-bubble">'+parsed+'</div>';
  msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;
  if(ttsOn) speak(text);
}

function addUserMessage(text){
  var msgs=document.getElementById('chat-messages');
  var div=document.createElement('div');div.className='msg user';
  div.innerHTML='<div class="msg-bubble">'+escHtml(text)+'</div><div class="msg-avatar" style="background:var(--plum-light);">🧒</div>';
  msgs.appendChild(div);
  msgs.scrollTop=msgs.scrollHeight;
}

function parseMessage(text){
  text=text.replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>');
  text=text.replace(/<step>([\s\S]*?)<\/step>/g,'<div class="step-box">$1</div>');
  text=text.replace(/<quiz>([\s\S]*?)<\/quiz>/g,'<div class="quiz-q">$1</div>');
  text=text.replace(/<reward>([\s\S]*?)<\/reward>/g,'<div class="reward-box">$1</div>');
  text=text.replace(/\n/g,'<br>');
  return text;
}

function escHtml(t){return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');}

function showTyping(){
  var msgs=document.getElementById('chat-messages');
  var div=document.createElement('div');div.className='msg ai';div.id='typing-bubble';
  div.innerHTML='<div class="msg-avatar">🤖</div><div class="typing"><span></span><span></span><span></span></div>';
  msgs.appendChild(div);msgs.scrollTop=msgs.scrollHeight;
}

function hideTyping(){var t=document.getElementById('typing-bubble');if(t)t.remove();}

function sendMessage(){
  var input=document.getElementById('chat-input');
  var text=input.value.trim();
  if(!text||isTyping)return;
  input.value='';
  addUserMessage(text);
  chatHistory.push({role:'user',content:text});
  isTyping=true;
  showTyping();
  callClaude(text);
}

function sendChip(btn){
  var text=btn.textContent.trim();
  document.getElementById('chat-input').value=text;
  sendMessage();
}

function handleKey(e){if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();}}

var TUTOR_API_URL = 'https://brightpath-sgd4.onrender.com/api/gemini-tutor';
async function callClaude(userMsg){
  // Build Gemini contents array (user/model alternating)
  var contents = [];
  for(var i=0;i<chatHistory.length;i++){
    var m=chatHistory[i];
    var role=m.role==='assistant'?'model':'user';
    contents.push({role:role,parts:[{text:m.content}]});
  }

  var subjectHint = (currentLesson && currentLesson.topic && currentLesson.topic!=='General')
    ? 'The student arrived from a lesson on "'+currentLesson.topic+'" ('+currentLesson.subject+', Class '+currentChildClass+'), so feel free to start there — but follow the student wherever their curiosity leads.'
    : 'Help the student with whatever they want to learn or ask about.';

  var profile = (currentLesson && currentLesson.profile) || '';

  var sysPrompt = "You are BrightPath — a warm, patient, encouraging AI tutor for students aged 11–14 in India (Classes 6–8).\n\n"+subjectHint+"\n\nThe student's learning profile: "+profile+".\n\nRULES:\n1. Answer ANY question the student asks — maths, science, history, English, Hindi, general knowledge, coding, life skills, creative writing, etc. Never refuse a topic.\n2. For sensitive or mature topics (violence, adult content, etc.), gently steer toward age-appropriate understanding without graphic detail.\n3. Keep each response SHORT — 3–5 sentences max per step. Use simple English.\n4. Use emojis and fun analogies to make things visual and memorable.\n5. Always be positive. Never say 'wrong'. Say 'Good try! Let's look at this differently 💪'.\n6. Adapt to learning profile:\n   - ADHD: very short bursts, bullet points, celebrate every small win.\n   - Dyslexia: simple short words, avoid dense paragraphs, offer to re-explain.\n   - Slow Learner: repeat in a different way, step-by-step, no rush.\n   - Neurodiverse: clear, literal, structured, no sarcasm.\n7. After every 3–4 exchanges naturally offer a quick quiz to check understanding.\n\nFORMATTING — use these special HTML tags in your reply:\n- Steps/explanations: <step>...</step>\n- Quiz: <quiz><h4>Quick Check! 🧠</h4><div class='quiz-opts'><button class='quiz-opt' onclick='checkAnswer(this,true)'>A) correct answer</button><button class='quiz-opt' onclick='checkAnswer(this,false)'>B) wrong</button><button class='quiz-opt' onclick='checkAnswer(this,false)'>C) wrong</button></div></quiz>\n- Praise: <reward><span class='r-emoji'>⭐</span><h4>Amazing!</h4><p>You nailed it!</p></reward>\n- Use **bold** for key words.\n- End every reply with a short friendly question to keep the student talking.";

  try{
    var resp = await fetch(TUTOR_API_URL, {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        system_instruction:{parts:[{text:sysPrompt}]},
        contents: contents,
        generationConfig:{maxOutputTokens:800,temperature:0.7}
      })
    });
    var data = await resp.json();
    var reply = (data.candidates&&data.candidates[0]&&data.candidates[0].content&&data.candidates[0].content.parts&&data.candidates[0].content.parts[0])
      ? data.candidates[0].content.parts[0].text
      : "I'm here to help! 😊 What would you like to learn or talk about?";
    chatHistory.push({role:'assistant',content:reply});
    hideTyping();
    addBotMessage(reply);
  } catch(e){
    hideTyping();
    addBotMessage('Oops! Something went wrong. Please check your internet connection and try again. 🌐');
  }
  isTyping=false;
}

function checkAnswer(btn,correct){
  var opts=btn.parentElement.querySelectorAll('.quiz-opt');
  opts.forEach(o=>o.disabled=true);
  if(correct){
    btn.classList.add('correct');
    setTimeout(()=>{
      addBotMessage('<reward><span class="r-emoji">🌟</span><h4>That\'s correct! You earned a star!</h4><p>Brilliant work — you really understood that!</p></reward>');
    },400);
  } else {
    btn.classList.add('wrong');
    setTimeout(()=>{
      addBotMessage("Good try! 💪 The right answer is highlighted. Let's look at why — it's a great learning moment!");
      btn.parentElement.querySelectorAll('.quiz-opt').forEach(o=>{if(o!==btn)o.classList.add('correct');});
    },400);
  }
}
