class APIResponse {
  constructor(statusCode,  data,message='success'){ 
    this.status = statusCode <400;
    this.message = message;
    this.data = data;
    this.success = true;
  }
}

export default APIResponse;