const URL = 'https://api.github.com/';

interface ApiResponse {
  feeds_url?: string;
  [key: string]: any;
}

class Advanced {
  private ajax: (url: string) => Promise<Response>;
  public data: ApiResponse;

  // fetch is the dependency window.fetch which is being added into the constructor
  // so that it can be swapped out for a mocked response during testing
  constructor(fetch: (url: string) => Promise<Response>) {
    this.ajax = fetch;
    this.data = {};
  }

  // This function's job is to fetch the data from the const URL
  // and pass it to the renderData function
  getData(): Promise<void> {
    return this.ajax(URL)
      .then((response) => response.json())
      .then((data: ApiResponse) => this.renderData(data));
  }

  // This function checks to make sure a particular property of data exists
  // and if so, sets the data to the property this.data
  renderData(data: ApiResponse): void {
    if (data.feeds_url) {
      this.data = data;
    }
  }
}

export default Advanced; 