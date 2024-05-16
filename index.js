require('dotenv').config();
const fs = require('fs');
const path = require('path');
const LEADCONE_API_KEY = process.env.LEADCONE_API_KEY;

const api_domain = 'https://api.leadcone.com';

const create_worker = async () => {
  try {
    const response = await fetch(api_domain + '/v1/workers', {
      method: 'POST',
      headers: {
          'Authorization': 'Basic ' + LEADCONE_API_KEY,
          'Content-Type': 'application/json',
      }
    })
    const data = await response.json();
    return data.data.uuid
  } catch (error) {
    console.error('Error:', error);
  }  
}

const get_worker_progress = async (worker_uuid) => {
  try {
    const response = await fetch(api_domain + '/v1/workers/' + worker_uuid + '/progress', {
      method: 'GET',
      headers: {
          'Authorization': 'Basic ' + LEADCONE_API_KEY,
          'Content-Type': 'application/json',
      }
    })
    const data = await response.json();
    console.log(data);
    return data.data
  } catch (error) {
    console.error('Error:', error);
  }
}

const get_results = async (worker_uuid) => {
  try {
    const response = await fetch(api_domain + '/v1/workers/' + worker_uuid + '/results/extract_emails',{
      method: 'GET',
      headers: {
        'Authorization': 'Basic ' + LEADCONE_API_KEY,
        'Content-Type': 'application/json',
      }
    })
    const data = await response.json();
    return data.data
  } catch (error) {
    console.error('Error:', error);
  }
}

const start_worker = async (worker_uuid, worker_options) => {
  try {
    const response = await fetch(api_domain + '/v1/workers/' + worker_uuid + '/start', {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + LEADCONE_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        data: worker_options
      })
    })
    return response.json();
  }
  catch (error) {
    console.error('Error:', error);
  }
}

const main = async () => {
  let worker_uuid = await create_worker();
  console.log(worker_uuid);

  const worker_options = {
    "settings": {
      "type": "extract_emails",
      "input": ["https://taylorpearson.me/contact-2/"],
      "max_email_count_per_domain": 2      
    }
  }

  const response_worker_started = await start_worker(worker_uuid, worker_options);
  console.log(response_worker_started);

  if (!response_worker_started.success) {
    console.log(response_worker_started);
    console.log('Worker failed to start');
    return;
  } else {
    console.log(response_worker_started);
    console.log('Worker started');
  }

  let progress = await get_worker_progress(worker_uuid);
  console.log(progress);
  while (progress.status != 'completed' && progress.status != 'failed' && progress.status != 'expired') {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    progress = await get_worker_progress(worker_uuid);
    console.log(progress);
  }
  if (progress.status == 'completed' || progress.status == 'expired') {
    let results = await get_results(worker_uuid);
    console.log(results);
    // write results to csv file
    let csv = '';
    // write header
    csv += 'original_url,url,email\n';
    results.forEach((result) => {
      csv += result.original_url + ',' + result.url + ',' + result.email + '\n';
    });
    fs.writeFileSync(path.join(__dirname, 'results.csv'), csv);
  }
}

main();