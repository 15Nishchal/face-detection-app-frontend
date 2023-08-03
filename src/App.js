import './App.css';
import Navigation from './components/Navigation/Navigation';
import FaceRecognition from './components/FaceRecognition/FaceRecognition';
import React, {Component} from 'react';
import Logo from './components/Logo/Logo';
import ImageLinkForm from './components/ImageLinkForm/ImageLinkForm';
import Rank from './components/Rank/Rank';
import Signin from './components/Signin/Signin';
import Register from './components/Register/Register';
import ParticlesBg from 'particles-bg';


const returnClarifaiRequestOptions = (imageURL) => {
  // Your PAT (Personal Access Token) can be found in the portal under Authentification
  const PAT = '776bc34f67ab40809c898b54ba9673c0';
  // Specify the correct user_id/app_id pairings
  // Since you're making inferences outside your app's scope
  const USER_ID = '15nishchal';       
  const APP_ID = 'test';
  // Change these to whatever model and image URL you want to use
  //const MODEL_ID = 'face-detection';
 // const MODEL_VERSION_ID = 'aa7f35c01e0642fda5cf400f543e7c40';    
  const IMAGE_URL = imageURL;

  const raw = JSON.stringify({
    "user_app_id": {
        "user_id": USER_ID,
        "app_id": APP_ID
    },
    "inputs": [
        {
            "data": {
                "image": {
                    "url": IMAGE_URL
                }
            }
        }
    ]
});

const requestOptions = {
  method: 'POST',
  headers: {
      'Accept': 'application/json',
      'Authorization': 'Key ' + PAT
  },
  body: raw
};
return requestOptions;

}
    
const MODEL_ID = 'face-detection';
class App extends Component {
  constructor(){
    super();
    this.state = {
      input : '',
      imageURL: '',
      box:{},
      route: '',
      isSignedIn: false,
      user: {
        id: '',
        name: '',
        email: '',
        entries: 0,
        joined: ''
      }
    }
  }
 
  loadUser = (data) => {
    this.setState({user: {
      id: data.id,
      name: data.name,
      email: data.email,
      entries: data.entries,
      joined: data.joined
    }})
  }


  onButtonSubmit = () => {
    this.setState({ imageURL: this.state.input });
  
    fetch("https://api.clarifai.com/v2/models/" + MODEL_ID + "/outputs", returnClarifaiRequestOptions(this.state.input))
      .then(response => response.json())
      .then(data => {
        if (data && data.outputs && data.outputs.length > 0) {
          this.calculateFaceBox(data.outputs[0]); // Calculate and display face box
          this.updateUserEntries(); // Update user entries
        } else {
          console.log('No faces detected.');
        }
      })
      .catch(err => console.log(err));
  }
  
  calculateFaceBox = (outputData) => {
    const clarifaiFace = outputData.data.regions[0].region_info.bounding_box;
    const image = document.getElementById('inputimage');
    const width = Number(image.width);
    const height = Number(image.height);
    const box = {
      leftCol: clarifaiFace.left_col * width,
      topRow: clarifaiFace.top_row * height,
      rightCol: width - (clarifaiFace.right_col * width),
      bottomRow: height - (clarifaiFace.bottom_row * height)
    };
    this.displayFaceBox(box);
  }
  
  updateUserEntries = () => {
    fetch('http://localhost:3000/image', {
      method: 'put',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: this.state.user.id
      })
    })
    .then(response => response.json())
    .then(count => {
      this.setState(prevState => ({
        user: {
          ...prevState.user,
          entries: count
        }
      }));
    })
    .catch(err => console.log(err));
  }
  
  displayFaceBox = (box) => {
    this.setState({ box: box });
  }
  
  onInputChange = (event) => {
    this.setState({input: event.target.value});
  }
  
  onRouteChange = (route) => {
    if(route === 'signout'){
      this.setState({isSignedIn: false});
    }else if(route === 'home'){
      this.setState({isSignedIn: true});
    }
    this.setState({route:route});
  }

  render (){
    return (
      <div className="App">
      <ParticlesBg className="particles" type="cobweb" bg={true} />

        <Navigation isSignedIn={this.state.isSignedIn} onRouteChange={this.onRouteChange}/>
        { this.state.route === 'home' 
          ? <div>
            <Logo/>
            <Rank name={this.state.user.name} entries={this.state.user.entries}/>
            <ImageLinkForm 
            onInputChange = {this.onInputChange} 
            onButtonSubmit = {this.onButtonSubmit}
            />
            <FaceRecognition box = {this.state.box} imageURL = {this.state.imageURL}/> 
           </div>
          :
          (
            this.state.route === 'signin' 
            ? <Signin loadUser={this.loadUser} onRouteChange = {this.onRouteChange}/>
            :<Register loadUser={this.loadUser} onRouteChange = {this.onRouteChange}/>
          )
          
        }
         
      </div>
    );
  }
 
}

export default App;




