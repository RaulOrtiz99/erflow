export const environment = {
  production: false,
  supabase: {
    url: 'https://vfkhjtmdwgtpxfkahrio.supabase.co',
    key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZma2hqdG1kd2d0cHhma2FocmlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzczOTI2OTcsImV4cCI6MjA1Mjk2ODY5N30.gjn9A-9kDClY-oS5ltlt-QtWOcyb3v4YnqNTtP3H5ZM',
    options: {
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    }
  }
};
