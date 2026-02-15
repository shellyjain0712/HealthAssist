import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

// Symptom-to-condition mapping database with conversational responses
const symptomDatabase: Record<
  string,
  {
    conditions: string[];
    specialists: string[];
    urgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
    advice: string[];
    empathy: string;
    followUp: string[];
  }
> = {
  // Head symptoms
  headache: {
    conditions: ["Tension headache", "Migraine", "Sinusitis", "Dehydration"],
    specialists: ["General Physician", "Neurologist"],
    urgency: "LOW",
    advice: [
      "Try to rest in a quiet, dark room if you can",
      "Drink plenty of water - dehydration is a common cause",
      "Over-the-counter pain relief like ibuprofen or acetaminophen can help",
    ],
    empathy:
      "Headaches can really put a damper on your day, and I'm sorry you're dealing with this.",
    followUp: [
      "How long have you had this headache?",
      "Is the pain on one side or both?",
      "Are you sensitive to light or sound?",
    ],
  },
  "severe headache": {
    conditions: [
      "Migraine",
      "Cluster headache",
      "Meningitis",
      "Brain aneurysm",
    ],
    specialists: ["Neurologist", "Emergency Medicine"],
    urgency: "HIGH",
    advice: [
      "Please consider seeking medical attention soon",
      "If this came on suddenly and is the worst headache you've ever had, go to the ER",
      "Note when it started and any accompanying symptoms",
    ],
    empathy:
      "I can hear that you're in significant pain, and that sounds really tough.",
    followUp: [
      "Did this headache come on suddenly?",
      "Do you have any neck stiffness or fever?",
      "Any changes in vision?",
    ],
  },
  dizziness: {
    conditions: [
      "Vertigo",
      "Low blood pressure",
      "Anemia",
      "Inner ear infection",
    ],
    specialists: ["ENT Specialist", "Neurologist", "Cardiologist"],
    urgency: "MEDIUM",
    advice: [
      "Sit or lie down right away to prevent falling",
      "Avoid sudden head movements",
      "Stay hydrated and eat regular meals",
    ],
    empathy:
      "Feeling dizzy can be really unsettling and even a bit scary. I understand.",
    followUp: [
      "Does the room seem to spin, or do you feel faint?",
      "Does it happen when you change positions?",
      "Any ringing in your ears?",
    ],
  },

  // Chest symptoms
  "chest pain": {
    conditions: ["Angina", "Heart attack", "GERD", "Muscle strain", "Anxiety"],
    specialists: ["Cardiologist", "Emergency Medicine"],
    urgency: "HIGH",
    advice: [
      "If you're having severe crushing pain, call emergency services immediately",
      "Try to stay calm and rest",
      "Chew an aspirin if you suspect heart issues (unless allergic)",
    ],
    empathy:
      "Chest pain can be frightening, and I want to make sure you're safe.",
    followUp: [
      "Is the pain sharp or more of a pressure feeling?",
      "Does it spread to your arm, jaw, or back?",
      "Any shortness of breath or sweating?",
    ],
  },
  "shortness of breath": {
    conditions: ["Asthma", "COPD", "Pneumonia", "Anxiety", "Heart failure"],
    specialists: ["Pulmonologist", "Cardiologist"],
    urgency: "HIGH",
    advice: [
      "Try to stay calm - anxiety can worsen breathlessness",
      "Sit upright to help your breathing",
      "If this is sudden and severe, please seek emergency care",
    ],
    empathy:
      "Having trouble breathing can feel really scary. I'm here to help you figure this out.",
    followUp: [
      "Did this come on suddenly?",
      "Do you have any chest tightness?",
      "Any known asthma or lung conditions?",
    ],
  },
  palpitations: {
    conditions: [
      "Anxiety",
      "Arrhythmia",
      "Hyperthyroidism",
      "Caffeine sensitivity",
    ],
    specialists: ["Cardiologist", "Endocrinologist"],
    urgency: "MEDIUM",
    advice: [
      "Try to take slow, deep breaths",
      "Cut back on caffeine and alcohol if you can",
      "Track when these episodes happen to share with your doctor",
    ],
    empathy:
      "Feeling your heart race unexpectedly can be quite alarming. Let's see what might be going on.",
    followUp: [
      "How fast does your heart seem to beat?",
      "Do you feel lightheaded with it?",
      "Had any caffeine or stress recently?",
    ],
  },

  // Digestive symptoms
  "stomach pain": {
    conditions: ["Gastritis", "Ulcer", "Food poisoning", "IBS", "Appendicitis"],
    specialists: ["Gastroenterologist", "General Surgeon"],
    urgency: "MEDIUM",
    advice: [
      "Try eating bland foods like toast or rice",
      "Avoid spicy, fatty foods for now",
      "A heating pad on your tummy might provide some comfort",
    ],
    empathy:
      "Stomach pain is no fun at all. I hope we can figure out what's bothering you.",
    followUp: [
      "Where exactly is the pain - upper, lower, left, or right side?",
      "Did you eat anything unusual recently?",
      "Any nausea or vomiting?",
    ],
  },
  nausea: {
    conditions: [
      "Food poisoning",
      "Gastritis",
      "Pregnancy",
      "Migraine",
      "Inner ear disorder",
    ],
    specialists: ["Gastroenterologist", "General Physician"],
    urgency: "LOW",
    advice: [
      "Sip on clear fluids like water or ginger tea",
      "Hold off on solid foods until you feel better",
      "Fresh air and rest often help",
    ],
    empathy:
      "Feeling nauseous is really uncomfortable. Let's see if we can help you feel better.",
    followUp: [
      "When did this start?",
      "Have you been able to keep fluids down?",
      "Any recent dietary changes or travel?",
    ],
  },
  vomiting: {
    conditions: [
      "Food poisoning",
      "Gastroenteritis",
      "Pregnancy",
      "Concussion",
    ],
    specialists: ["Gastroenterologist", "General Physician"],
    urgency: "MEDIUM",
    advice: [
      "Stay hydrated with small sips of water or oral rehydration solution",
      "Rest your stomach for an hour before trying fluids again",
      "If there's blood or it continues more than 24 hours, please see a doctor",
    ],
    empathy:
      "I'm sorry you're feeling so unwell. Vomiting really takes it out of you.",
    followUp: [
      "How many times have you been sick?",
      "Are you able to keep anything down?",
      "Any fever or diarrhea too?",
    ],
  },
  diarrhea: {
    conditions: [
      "Food poisoning",
      "Viral gastroenteritis",
      "IBS",
      "Bacterial infection",
    ],
    specialists: ["Gastroenterologist"],
    urgency: "LOW",
    advice: [
      "Drink plenty of fluids with electrolytes",
      "Stick to the BRAT diet - bananas, rice, applesauce, and toast",
      "Give your gut time to recover",
    ],
    empathy:
      "Dealing with diarrhea is exhausting and uncomfortable. Let's make sure you stay hydrated.",
    followUp: [
      "How many episodes have you had?",
      "Any blood or mucus noticed?",
      "Has anyone else you've been with gotten sick too?",
    ],
  },

  // Respiratory symptoms
  cough: {
    conditions: [
      "Common cold",
      "Bronchitis",
      "Allergies",
      "Asthma",
      "COVID-19",
    ],
    specialists: ["Pulmonologist", "General Physician"],
    urgency: "LOW",
    advice: [
      "Honey in warm water or tea can soothe your throat",
      "Stay well hydrated",
      "Rest your voice if you can",
    ],
    empathy:
      "A persistent cough is exhausting, especially when it disrupts your sleep.",
    followUp: [
      "Is it a dry cough or are you bringing up phlegm?",
      "How long have you had it?",
      "Any fever or body aches?",
    ],
  },
  "sore throat": {
    conditions: ["Viral infection", "Strep throat", "Tonsillitis", "Allergies"],
    specialists: ["ENT Specialist", "General Physician"],
    urgency: "LOW",
    advice: [
      "Gargle with warm salt water a few times a day",
      "Suck on lozenges or ice chips",
      "Warm drinks with honey can be soothing",
    ],
    empathy:
      "A sore throat makes everything harder - even just swallowing. I understand how uncomfortable that is.",
    followUp: [
      "Is it painful to swallow?",
      "Any white patches visible in your throat?",
      "Do you have swollen glands in your neck?",
    ],
  },
  "runny nose": {
    conditions: ["Common cold", "Allergies", "Sinusitis"],
    specialists: ["ENT Specialist", "Allergist"],
    urgency: "LOW",
    advice: [
      "Saline nasal spray can help clear things out",
      "Keep tissues handy and stay hydrated",
      "Antihistamines might help if it's allergies",
    ],
    empathy:
      "A runny nose is annoying and can make you feel miserable. Let's figure out what's causing it.",
    followUp: [
      "Is the discharge clear or colored?",
      "Any facial pressure or headache?",
      "Does it get worse in certain environments?",
    ],
  },

  // General symptoms
  fever: {
    conditions: ["Viral infection", "Bacterial infection", "Flu", "COVID-19"],
    specialists: ["General Physician", "Infectious Disease Specialist"],
    urgency: "MEDIUM",
    advice: [
      "Rest is your body's way of fighting off infection",
      "Stay well hydrated - water, clear broths, herbal teas",
      "Fever reducers like acetaminophen can help you feel more comfortable",
    ],
    empathy:
      "Having a fever makes you feel absolutely drained. Your body is working hard to fight something off.",
    followUp: [
      "How high has your temperature gotten?",
      "Any other symptoms like cough or body aches?",
      "How long have you felt this way?",
    ],
  },
  fatigue: {
    conditions: [
      "Anemia",
      "Thyroid disorder",
      "Diabetes",
      "Depression",
      "Sleep disorder",
    ],
    specialists: ["General Physician", "Endocrinologist"],
    urgency: "LOW",
    advice: [
      "Make sure you're getting enough quality sleep",
      "Eat regular, nutritious meals",
      "Some gentle exercise might actually boost your energy",
    ],
    empathy:
      "Feeling exhausted all the time is really tough, especially when you have things to do.",
    followUp: [
      "How's your sleep been lately?",
      "Are you under more stress than usual?",
      "Any changes in appetite or weight?",
    ],
  },
  "body aches": {
    conditions: ["Flu", "Viral infection", "Fibromyalgia", "Dehydration"],
    specialists: ["General Physician", "Rheumatologist"],
    urgency: "LOW",
    advice: [
      "A warm bath can help soothe achy muscles",
      "Stay hydrated and rest",
      "Over-the-counter pain relievers can provide relief",
    ],
    empathy:
      "When your whole body aches, even getting out of bed feels like a challenge. I feel for you.",
    followUp: [
      "Did this start suddenly?",
      "Any fever or chills along with the aches?",
      "Have you done any unusual physical activity?",
    ],
  },

  // Skin symptoms
  rash: {
    conditions: ["Allergic reaction", "Eczema", "Psoriasis", "Viral infection"],
    specialists: ["Dermatologist", "Allergist"],
    urgency: "LOW",
    advice: [
      "Try not to scratch, even though it's tempting",
      "A cool compress might soothe the irritation",
      "Mild, fragrance-free moisturizer can help",
    ],
    empathy:
      "Skin rashes can be itchy, uncomfortable, and even embarrassing. Let's see what we can do.",
    followUp: [
      "When did you first notice the rash?",
      "Did you try any new products or eat something different?",
      "Is it spreading or staying in one place?",
    ],
  },
  itching: {
    conditions: ["Allergies", "Dry skin", "Eczema", "Liver problems"],
    specialists: ["Dermatologist", "Allergist"],
    urgency: "LOW",
    advice: [
      "Keep your skin moisturized with gentle products",
      "Avoid hot showers which can dry skin out more",
      "Anti-itch creams or oral antihistamines might help",
    ],
    empathy:
      "Constant itching is maddening and can really disrupt your day. I understand.",
    followUp: [
      "Is it in one area or all over?",
      "Any visible rash or changes to your skin?",
      "Does it get worse at night?",
    ],
  },

  // Musculoskeletal symptoms
  "back pain": {
    conditions: [
      "Muscle strain",
      "Herniated disc",
      "Sciatica",
      "Kidney stones",
    ],
    specialists: ["Orthopedist", "Neurologist", "Physiotherapist"],
    urgency: "MEDIUM",
    advice: [
      "Try alternating between ice and heat on the area",
      "Gentle stretching might help, but don't push through pain",
      "Pay attention to your posture if you sit a lot",
    ],
    empathy:
      "Back pain can really limit what you're able to do. I know how frustrating that is.",
    followUp: [
      "Did something specific trigger the pain?",
      "Does it radiate down your legs?",
      "Any numbness or tingling?",
    ],
  },
  "joint pain": {
    conditions: ["Arthritis", "Injury", "Gout", "Infection"],
    specialists: ["Rheumatologist", "Orthopedist"],
    urgency: "MEDIUM",
    advice: [
      "Rest the affected joint when possible",
      "Ice can help reduce inflammation",
      "Gentle movement can prevent stiffness, but don't overdo it",
    ],
    empathy:
      "Joint pain can make everyday activities difficult. That's really hard to deal with.",
    followUp: [
      "Which joints are affected?",
      "Any swelling, redness, or warmth in the area?",
      "Is it worse in the morning?",
    ],
  },

  // Neurological symptoms
  numbness: {
    conditions: ["Carpal tunnel", "Nerve compression", "Diabetes", "Stroke"],
    specialists: ["Neurologist", "Orthopedist"],
    urgency: "MEDIUM",
    advice: [
      "If sudden numbness on one side of your body, call emergency services immediately",
      "Note which areas are affected and when it happens",
      "Avoid positions that might compress nerves",
    ],
    empathy:
      "Numbness and tingling can be worrying symptoms. Let me help you understand what might be happening.",
    followUp: [
      "Which part of your body feels numb?",
      "Did it come on suddenly?",
      "Any weakness or confusion along with it?",
    ],
  },
  "vision changes": {
    conditions: ["Eye strain", "Glaucoma", "Diabetes", "Stroke"],
    specialists: ["Ophthalmologist", "Neurologist"],
    urgency: "HIGH",
    advice: [
      "Any sudden vision loss needs immediate medical attention",
      "Take breaks from screens if you've been staring at them",
      "Get your eyes checked regularly, especially if you have diabetes",
    ],
    empathy:
      "Changes to your vision can be really concerning. This is definitely something to take seriously.",
    followUp: [
      "What kind of changes are you experiencing?",
      "Was it sudden or gradual?",
      "Any flashes of light or floaters?",
    ],
  },

  // Mental health
  anxiety: {
    conditions: ["Generalized anxiety disorder", "Panic disorder", "Stress"],
    specialists: ["Psychiatrist", "Psychologist"],
    urgency: "LOW",
    advice: [
      "Try deep breathing exercises - inhale for 4, hold for 4, exhale for 4",
      "Ground yourself by naming 5 things you can see around you",
      "Remember that anxiety, while uncomfortable, will pass",
    ],
    empathy:
      "Anxiety can feel overwhelming and all-consuming. You're not alone in this, and it's okay to ask for help.",
    followUp: [
      "How often do you feel this way?",
      "Are there specific triggers you've noticed?",
      "Any physical symptoms like racing heart or sweating?",
    ],
  },
  depression: {
    conditions: [
      "Clinical depression",
      "Bipolar disorder",
      "Situational depression",
    ],
    specialists: ["Psychiatrist", "Psychologist"],
    urgency: "MEDIUM",
    advice: [
      "Please reach out to someone you trust about how you're feeling",
      "Small steps like a short walk can sometimes help",
      "Professional support can make a real difference",
    ],
    empathy:
      "What you're going through sounds really difficult. It takes courage to talk about these feelings, and I'm glad you reached out.",
    followUp: [
      "How long have you been feeling this way?",
      "Are you getting enough sleep?",
      "Do you have support from friends or family?",
    ],
  },
  insomnia: {
    conditions: ["Sleep disorder", "Anxiety", "Depression", "Sleep apnea"],
    specialists: ["Sleep Specialist", "Psychiatrist"],
    urgency: "LOW",
    advice: [
      "Try to keep a consistent sleep schedule, even on weekends",
      "Create a relaxing bedtime routine - no screens for an hour before bed",
      "Keep your bedroom cool, dark, and quiet",
    ],
    empathy:
      "Not being able to sleep is exhausting in itself. It affects everything when you can't get proper rest.",
    followUp: [
      "Trouble falling asleep, staying asleep, or both?",
      "How many hours are you currently getting?",
      "Any snoring or gasping during sleep that you know of?",
    ],
  },

  // Women's health / Gynecology
  "menstrual cramps": {
    conditions: [
      "Dysmenorrhea",
      "Endometriosis",
      "Uterine fibroids",
      "Pelvic inflammatory disease",
    ],
    specialists: ["Gynecologist"],
    urgency: "LOW",
    advice: [
      "A heating pad on your lower abdomen can provide relief",
      "Over-the-counter pain relievers like ibuprofen often help",
      "Light exercise or stretching may ease the discomfort",
    ],
    empathy:
      "Period cramps can be really debilitating. I'm sorry you're dealing with this discomfort.",
    followUp: [
      "How severe is the pain on a scale of 1-10?",
      "Does the pain interfere with your daily activities?",
      "Are your periods regular?",
    ],
  },
  "irregular periods": {
    conditions: ["PCOS", "Thyroid disorder", "Stress", "Hormonal imbalance"],
    specialists: ["Gynecologist", "Endocrinologist"],
    urgency: "LOW",
    advice: [
      "Track your cycles to identify patterns",
      "Maintain a healthy diet and regular exercise",
      "Reduce stress through relaxation techniques",
    ],
    empathy:
      "Irregular periods can be frustrating and worrying. Let's see what might be going on.",
    followUp: [
      "How long have your periods been irregular?",
      "Any significant weight changes recently?",
      "Are you under more stress than usual?",
    ],
  },
  "pelvic pain": {
    conditions: [
      "Ovarian cysts",
      "Endometriosis",
      "Pelvic inflammatory disease",
      "Ectopic pregnancy",
    ],
    specialists: ["Gynecologist"],
    urgency: "MEDIUM",
    advice: [
      "Rest and avoid strenuous activities",
      "Apply heat to the pelvic area for comfort",
      "If pain is severe or accompanied by fever, seek medical attention",
    ],
    empathy:
      "Pelvic pain can really affect your quality of life. It's important we understand what's causing it.",
    followUp: [
      "Is the pain constant or does it come and go?",
      "Is there any chance you could be pregnant?",
      "Any unusual vaginal discharge?",
    ],
  },
  "period problems": {
    conditions: ["Menorrhagia", "Amenorrhea", "PCOS", "Hormonal imbalance"],
    specialists: ["Gynecologist"],
    urgency: "LOW",
    advice: [
      "Keep a menstrual diary to track symptoms",
      "Ensure you're getting adequate iron if bleeding is heavy",
      "Consult a gynecologist for persistent issues",
    ],
    empathy:
      "Period problems can be disruptive and concerning. You're right to want to address this.",
    followUp: [
      "What specific issues are you experiencing?",
      "How long has this been going on?",
      "Any other symptoms like fatigue or mood changes?",
    ],
  },
  "pregnancy symptoms": {
    conditions: ["Pregnancy", "Ectopic pregnancy", "Hormonal changes"],
    specialists: ["Gynecologist", "Obstetrician"],
    urgency: "MEDIUM",
    advice: [
      "Take a home pregnancy test if you haven't already",
      "Schedule an appointment with a gynecologist for confirmation",
      "Start taking prenatal vitamins with folic acid",
    ],
    empathy:
      "This is an important time to get proper medical guidance. I'm here to help you navigate this.",
    followUp: [
      "Have you taken a pregnancy test?",
      "When was your last period?",
      "Any concerning symptoms like bleeding or severe pain?",
    ],
  },
};

// Greetings and casual conversation responses
const casualResponses: Record<string, string[]> = {
  greeting: [
    "Hey there! 👋 I'm doing well, thanks for asking! How are you feeling today? Is there anything health-related I can help you with?",
    "Hello! Great to chat with you! I'm here to help with any health concerns you might have. What's on your mind?",
    "Hi! Nice to meet you! I'm your health companion. Feel free to share what's bothering you, and I'll do my best to help.",
  ],
  thanks: [
    "You're very welcome! I'm glad I could help. If you have any more questions or concerns, don't hesitate to ask. Take care of yourself! 💚",
    "Happy to help! Remember, I'm always here if you need to chat about health concerns. Wishing you good health!",
    "Anytime! That's what I'm here for. Don't hesitate to come back if you need anything else. Feel better soon!",
  ],
  bye: [
    "Take care of yourself! Remember, if your symptoms persist or get worse, please do see a healthcare professional. Goodbye for now! 👋",
    "Goodbye! I hope you feel better soon. Don't hesitate to come back if you need any more health advice. Stay healthy!",
    "Bye! Wishing you good health. Remember to rest up and take care. See you next time!",
  ],
  howAreYou: [
    "I'm doing great, thank you for asking! As an AI health assistant, I'm always ready to help. How about you - how are you feeling today?",
    "I'm wonderful, thanks! More importantly, how are you doing? Is there something I can help you with today?",
  ],
  unclear: [
    "I want to make sure I understand you correctly. Could you tell me a bit more about what you're experiencing? For example, are you having any physical symptoms like pain, fever, or fatigue?",
    "I'm here to help! To give you the best guidance, could you describe your symptoms in more detail? What's been bothering you and for how long?",
    "I'd love to help you out! Can you share more about how you're feeling? Any specific symptoms or discomforts you've noticed?",
  ],
};

// Detect casual conversation intent
function detectCasualIntent(message: string): string | null {
  const lower = message.toLowerCase().trim();

  // Greetings
  if (
    /^(hi|hello|hey|good\s*(morning|afternoon|evening)|howdy|hola|greetings|yo)\b/i.test(
      lower,
    )
  ) {
    return "greeting";
  }

  // Thank you
  if (/\b(thanks?|thank\s*you|thx|appreciate|grateful)\b/i.test(lower)) {
    return "thanks";
  }

  // Goodbye
  if (
    /\b(bye|goodbye|see\s*you|take\s*care|later|cya|farewell)\b/i.test(lower)
  ) {
    return "bye";
  }

  // How are you
  if (
    /\b(how\s*(are|r)\s*you|how('s|\s*is)\s*it\s*going|what'?s?\s*up)\b/i.test(
      lower,
    )
  ) {
    return "howAreYou";
  }

  return null;
}

// Extract symptoms from user message
function extractSymptoms(message: string): string[] {
  const lowerMessage = message.toLowerCase();
  const foundSymptoms: string[] = [];

  // Check for exact matches and partial matches
  for (const symptom of Object.keys(symptomDatabase)) {
    if (lowerMessage.includes(symptom)) {
      foundSymptoms.push(symptom);
    }
  }

  // Additional keyword extraction with natural language variations
  const additionalKeywords: Record<string, string> = {
    "can't sleep": "insomnia",
    "cant sleep": "insomnia",
    "trouble sleeping": "insomnia",
    "not sleeping well": "insomnia",
    "difficulty sleeping": "insomnia",
    "can't breathe": "shortness of breath",
    "cant breathe": "shortness of breath",
    "hard to breathe": "shortness of breath",
    "breathing difficulty": "shortness of breath",
    breathless: "shortness of breath",
    "out of breath": "shortness of breath",
    "throwing up": "vomiting",
    "been sick": "vomiting",
    "feel sick": "nausea",
    "feeling sick": "nausea",
    queasy: "nausea",
    nauseous: "nausea",
    "tummy ache": "stomach pain",
    "belly pain": "stomach pain",
    "stomach hurts": "stomach pain",
    "tummy hurts": "stomach pain",
    "abdominal pain": "stomach pain",
    "heart racing": "palpitations",
    "heart beating fast": "palpitations",
    "heart pounding": "palpitations",
    "feeling tired": "fatigue",
    "so tired": "fatigue",
    exhausted: "fatigue",
    "no energy": "fatigue",
    "worn out": "fatigue",
    "feeling sad": "depression",
    "feeling down": "depression",
    "feeling low": "depression",
    "feeling blue": "depression",
    "feeling worried": "anxiety",
    "feeling anxious": "anxiety",
    "feeling nervous": "anxiety",
    "stressed out": "anxiety",
    panicky: "anxiety",
    "pain in chest": "chest pain",
    "chest hurts": "chest pain",
    "pain in back": "back pain",
    "back hurts": "back pain",
    "my back is killing me": "back pain",
    "pain in head": "headache",
    "head hurts": "headache",
    "my head is pounding": "headache",
    migraine: "severe headache",
    "high temperature": "fever",
    "feeling hot": "fever",
    feverish: "fever",
    "burning up": "fever",
    "running a fever": "fever",
    "throat hurts": "sore throat",
    "scratchy throat": "sore throat",
    "painful swallowing": "sore throat",
    "stuffy nose": "runny nose",
    "blocked nose": "runny nose",
    congested: "runny nose",
    "skin rash": "rash",
    "spots on skin": "rash",
    breakout: "rash",
    "itchy skin": "itching",
    "joints hurt": "joint pain",
    "achy joints": "joint pain",
    "stiff joints": "joint pain",
    "body is aching": "body aches",
    "everything hurts": "body aches",
    "muscles aching": "body aches",
    "pins and needles": "numbness",
    tingling: "numbness",
    "can't see well": "vision changes",
    "blurry vision": "vision changes",
    "vision is blurry": "vision changes",
    "light headed": "dizziness",
    lightheaded: "dizziness",
    "room is spinning": "dizziness",
    vertigo: "dizziness",
    "loose stools": "diarrhea",
    "upset stomach": "diarrhea",
    "the runs": "diarrhea",
    coughing: "cough",
    "hacking cough": "cough",
    "persistent cough": "cough",
  };

  for (const [phrase, symptom] of Object.entries(additionalKeywords)) {
    if (lowerMessage.includes(phrase) && !foundSymptoms.includes(symptom)) {
      foundSymptoms.push(symptom);
    }
  }

  return foundSymptoms;
}

// Generate a conversational, human-like response
function analyzeSymptoms(
  message: string,
  symptoms: string[],
): {
  conditions: string[];
  specialists: string[];
  urgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY";
  advice: string[];
  response: string;
} {
  // Check for casual conversation first
  const casualIntent = detectCasualIntent(message);
  if (casualIntent && symptoms.length === 0) {
    const responses = casualResponses[casualIntent];
    const randomResponse =
      responses[Math.floor(Math.random() * responses.length)];
    return {
      conditions: [],
      specialists: [],
      urgency: "LOW",
      advice: [],
      response: randomResponse,
    };
  }

  // If no symptoms detected, ask for clarification in a friendly way
  if (symptoms.length === 0) {
    const unclearResponses = casualResponses.unclear;
    const randomResponse =
      unclearResponses[Math.floor(Math.random() * unclearResponses.length)];
    return {
      conditions: [],
      specialists: [],
      urgency: "LOW",
      advice: [],
      response: randomResponse,
    };
  }

  // Build conversational response with symptoms
  const allConditions: Set<string> = new Set();
  const allSpecialists: Set<string> = new Set();
  const allAdvice: string[] = [];
  const empathyStatements: string[] = [];
  const followUpQuestions: string[] = [];
  let maxUrgency: "LOW" | "MEDIUM" | "HIGH" | "EMERGENCY" = "LOW";
  const urgencyOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, EMERGENCY: 3 };

  for (const symptom of symptoms) {
    const data = symptomDatabase[symptom];
    if (data) {
      data.conditions.forEach((c) => allConditions.add(c));
      data.specialists.forEach((s) => allSpecialists.add(s));
      data.advice.forEach((a) => {
        if (!allAdvice.includes(a)) allAdvice.push(a);
      });
      if (data.empathy && !empathyStatements.includes(data.empathy)) {
        empathyStatements.push(data.empathy);
      }
      data.followUp.forEach((q) => {
        if (!followUpQuestions.includes(q)) followUpQuestions.push(q);
      });
      if (urgencyOrder[data.urgency] > urgencyOrder[maxUrgency]) {
        maxUrgency = data.urgency;
      }
    }
  }

  // Build a natural, conversational response
  let response = "";

  // Start with empathy
  if (empathyStatements.length > 0) {
    response += empathyStatements[0] + " ";
  }

  // Acknowledge what they said
  if (symptoms.length === 1) {
    response += `Let me help you understand what might be going on with your ${symptoms[0]}.\n\n`;
  } else {
    const symptomList =
      symptoms.slice(0, -1).join(", ") +
      " and " +
      symptoms[symptoms.length - 1];
    response += `I can see you're dealing with ${symptomList}. Let me share some thoughts.\n\n`;
  }

  // Possible conditions - in a conversational way
  const conditionsList = Array.from(allConditions).slice(0, 4);
  if (conditionsList.length > 0) {
    response += `**What this could be:**\n`;
    response += `Based on what you've described, there are a few things that could be causing this. `;
    if (conditionsList.length === 1) {
      response += `It might be ${conditionsList[0].toLowerCase()}.`;
    } else {
      response += `Common possibilities include ${conditionsList
        .slice(0, -1)
        .map((c) => c.toLowerCase())
        .join(
          ", ",
        )}, or possibly ${conditionsList[conditionsList.length - 1].toLowerCase()}.`;
    }
    response += "\n\n";
  }

  // Urgency notice - but conversational
  if (maxUrgency === "EMERGENCY") {
    response += `⚠️ **Please seek immediate medical attention.** The symptoms you're describing could indicate something serious that needs to be evaluated right away. Please go to your nearest emergency room or call emergency services.\n\n`;
  } else if (maxUrgency === "HIGH") {
    response += `⚠️ **Important:** I'd recommend seeing a doctor soon about this. While it might not be an emergency, these symptoms warrant professional evaluation to be safe.\n\n`;
  }

  // Practical advice - conversational style
  if (allAdvice.length > 0) {
    response += `**What might help:**\n`;
    const adviceToShare = allAdvice.slice(0, 3);
    adviceToShare.forEach((advice, index) => {
      response += `• ${advice}\n`;
    });
    response += "\n";
  }

  // Specialist recommendation - natural
  const specialistsList = Array.from(allSpecialists).slice(0, 2);
  if (specialistsList.length > 0) {
    response += `**Who can help:**\n`;
    if (maxUrgency === "HIGH" || maxUrgency === "EMERGENCY") {
      response += `Given your symptoms, I'd suggest seeing a ${specialistsList.join(" or ")} as soon as possible.`;
    } else {
      response += `If this continues or gets worse, consider visiting a ${specialistsList.join(" or ")}. They can properly evaluate what's going on.`;
    }
    response += "\n\n";
  }

  // Add urgency level in a user-friendly way
  const urgencyMessages: Record<string, string> = {
    LOW: "This doesn't seem urgent, but keep an eye on it.",
    MEDIUM: "This warrants attention - schedule a visit if it persists.",
    HIGH: "This needs prompt medical attention.",
    EMERGENCY: "Please seek immediate emergency care.",
  };
  response += `**Urgency Level:** ${maxUrgency}\n`;
  response += urgencyMessages[maxUrgency] + "\n\n";

  // Add a follow-up question to keep conversation going
  if (followUpQuestions.length > 0 && maxUrgency !== "EMERGENCY") {
    const randomQuestion =
      followUpQuestions[
        Math.floor(Math.random() * Math.min(2, followUpQuestions.length))
      ];
    response += `To help me understand better: ${randomQuestion}\n\n`;
  }

  // Disclaimer - softer tone
  response += `*Remember, I'm here to provide helpful information, but this isn't a substitute for seeing a real doctor. When in doubt, please get checked out!*`;

  return {
    conditions: Array.from(allConditions),
    specialists: Array.from(allSpecialists),
    urgency: maxUrgency,
    advice: allAdvice,
    response,
  };
}

// GET - Fetch chat sessions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (sessionId) {
      // Fetch specific session with messages
      const chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId: session.user.id },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });

      if (!chatSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 },
        );
      }

      return NextResponse.json({ session: chatSession });
    }

    // Fetch all sessions for user
    const sessions = await prisma.chatSession.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 },
    );
  }
}

// POST - Send a message and get AI response
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { message, sessionId } = body;

    if (!message) {
      return NextResponse.json(
        { error: "Message is required" },
        { status: 400 },
      );
    }

    let chatSession;

    if (sessionId) {
      // Continue existing session
      chatSession = await prisma.chatSession.findUnique({
        where: { id: sessionId, userId: session.user.id },
      });

      if (!chatSession) {
        return NextResponse.json(
          { error: "Session not found" },
          { status: 404 },
        );
      }
    } else {
      // Create new session
      chatSession = await prisma.chatSession.create({
        data: {
          userId: session.user.id,
          title: message.slice(0, 50) + (message.length > 50 ? "..." : ""),
        },
      });
    }

    // Extract symptoms and analyze
    const symptoms = extractSymptoms(message);
    const analysis = analyzeSymptoms(message, symptoms);

    // Save user message
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "user",
        content: message,
        extractedSymptoms:
          symptoms.length > 0 ? JSON.stringify(symptoms) : null,
      },
    });

    // Save AI response
    const aiMessage = await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: "assistant",
        content: analysis.response,
        extractedSymptoms:
          symptoms.length > 0 ? JSON.stringify(symptoms) : null,
      },
    });

    // Update session with analysis summary
    if (symptoms.length > 0) {
      await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: {
          summary: `Symptoms: ${symptoms.join(", ")}`,
          suggestedSpecialties: JSON.stringify(analysis.specialists),
          urgencyLevel: analysis.urgency,
        },
      });
    }

    return NextResponse.json({
      sessionId: chatSession.id,
      message: {
        id: aiMessage.id,
        role: "assistant",
        content: analysis.response,
        symptoms,
        analysis: {
          conditions: analysis.conditions,
          specialists: analysis.specialists,
          urgency: analysis.urgency,
        },
      },
    });
  } catch (error) {
    console.error("Error processing message:", error);
    return NextResponse.json(
      { error: "Failed to process message" },
      { status: 500 },
    );
  }
}

// DELETE - Delete a chat session
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("sessionId");

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 },
      );
    }

    await prisma.chatSession.delete({
      where: { id: sessionId, userId: session.user.id },
    });

    return NextResponse.json({ message: "Session deleted successfully" });
  } catch (error) {
    console.error("Error deleting session:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 },
    );
  }
}
