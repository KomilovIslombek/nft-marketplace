function getTimeParts(ms) {
  const msInHour = 3600000;
  const msInMinute = 60000;
  const msInSecond = 1000;

  // Step 1: how many FULL hours fit in ms?
  const hours = Math.floor(ms / msInHour);
  const msLeftAfterHours = ms - (hours * msInHour);

  const minutes = Math.floor(msLeftAfterHours / msInMinute)
  const msLeftAfterMinutes = msLeftAfterHours - (minutes * msInMinute)

  const seconds = Math.floor(msLeftAfterMinutes / msInSecond)

  return { hours, minutes, seconds }
}

function formatTimeParts({hours = false, minutes = false, seconds = false}) {

    let timeInString = String(hours).padStart(2, '0')
    timeInString += `:${String(minutes).padStart(2, '0')}`
    timeInString += `:${String(seconds).padStart(2, '0')}`

    document.getElementById("timer-hours").textContent = String(hours).padStart(2, '0') 
    document.getElementById("timer-minutes").textContent = String(minutes).padStart(2, '0') 
    document.getElementById("timer-seconds").textContent = String(seconds).padStart(2, '0') 
    // return timeInString
}
/*
console.log(getTimeParts(9045000));
// Expected output: { hours: 2, minutes: 30, seconds: 45 }
console.log(getTimeParts(5000));     // expect { hours: 0, minutes: 0, seconds: 5 }
console.log(getTimeParts(65000));    // expect { hours: 0, minutes: 1, seconds: 5 }
console.log(getTimeParts(9045500)); // 500ms extra
*/

// 1. Create "now" using Date.now()
// const now = Date.now();

// 2. Create a target: exactly 1 hour from now.
//    Think in ms: 1 hour = 3600000ms. How do you add that to "now"?
// const target = now + 3600000;
// const target = now + 10000;
let endTIme = localStorage.getItem('endtime-auction')
const target = endTIme ?? new Date('2026-07-28T18:00:00').getTime();
if(!endTIme) { 
    localStorage.setItem("endtime-auction", target)
}

// 3. Subtract to get the duration remaining
// const duration = target - now;

function updateCountDown() {
  const now = Date.now();
  const duration = target - now;

  // your fix goes here — check BEFORE logging/using getTimeParts
  if (duration <= 0) {
    console.log('Auction ended');
    clearInterval(timerId);
    return; // stop this tick from continuing further
  }

  console.log(formatTimeParts(getTimeParts(duration)));
  // console.log(getTimeParts(duration));
}

const timerId = setInterval(updateCountDown, 1000);


// console.log(String(5).padStart(2, '0'));   // what do you get?
// console.log(String(45).padStart(2, '0'));  // what do you get?
// console.log(String(3).padStart(2, '0'));   // try a different pad character — what happens?

// console.log('duration in ms:', duration);
// console.log(getTimeParts(duration)); // { hours: 1, minutes: 0, seconds: 0 }