const axios = require('axios');
const { ApiError, EntityNotFoundError } = require('./error');

class SpotifyApi {
  constructor(accessToken) {
    this.accessToken = accessToken;
    }
    
    static async getAccessToken(clientId, clientSecret) {
        const bearer = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
        const { data: { access_token: accessToken } = {} } = await axios.post(
        'https://accounts.spotify.com/api/token',
        'grant_type=client_credentials',
        {
            headers: {
            Authorization:  `Basic ${bearer}`,
            'Content-Type': 'application/x-www-form-urlencoded'
            }
        }
        );  
      return accessToken;
    }

   getAlbum(albumId, callback) {
    // web-api/reference/get-an-album
    if (!this.accessToken) {
        return callback('Access token not available. Please authenticate first.');
      }
  
    axios
        .get(`https://api.spotify.com/v1/albums/${albumId}`, {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        })
        .then((response) => {  
          const albumData = {
            albumId:response.data.id,

            genres:response.data.genres,
            name: response.data.name,
            imageUrl: response.data.images[0]?.url || null,
            releaseDate: response.data.release_date,
            //tracks:response.data.tracks.items[0].id
          };
          //})
          //.then((response,albumData) => {
          this.getArtist(response.data.artists[0].id,(error,arsdata) => {
            //add = [arsdata];
            albumData['artists'] = [arsdata];

            this.getTrack(response.data.tracks.items[0].id,(error2,tradata) => {
              albumData['tracks'] = [tradata];
              //console.log(albumData);
              callback(null,albumData);

            });
          });
        })
        .catch(error => {
          // console.error('why:',error.message);
          // callback(error || 'Request failed');
          if (error.response && error.response.status === 404) {
            callback(new EntityNotFoundError()); // Call callback with an error message
            //throw new EntityNotFoundError('Artist top tracks not found'); // Then throw EntityNotFoundError
          } else {
            callback(new ApiError());
          } 
        });
      }
    searchAlbums(query, callback) {
        // web-api/reference/search
        if (!this.accessToken) {
            return callback('Access token not available. Please authenticate first.');
          }
          let link = `https://api.spotify.com/v1/search?q=${query}&type=album`;
          console.log(link);
          axios
            .get(link, {
            //https://api.spotify.com/v1/search?q=remaster%2520track%3ADoxy%2520artist%3AMiles%2520Davis&type=album
              params: {
                q: query,
                type: 'album',
              },
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            })
            .then((response) => {
              this.getAlbum(response.data.albums.items[0].id,(error,albdataa) => {
                //console.log([albdataa]);
                callback(null, [albdataa]);
              });
            })
            .catch((error) => {
              if (error.response && error.response.status === 404) {
                callback(new EntityNotFoundError()); // Call callback with an error message
                //throw new EntityNotFoundError('Artist top tracks not found'); // Then throw EntityNotFoundError
              } else {
                callback(null, []);
              } 
            });
      }
    getTrack(trackId, callback) {
        // web-api/reference/get-track
        if (!this.accessToken) {
            return callback('Access token not available. Please authenticate first.');
          }
      
          axios
            .get(`https://api.spotify.com/v1/tracks/${trackId}`, {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            })
            .then((response) => {
              const trackData = {
                albumId:response.data.album.id,
                durationMs: response.data.duration_ms,
                trackId: response.data.id,
                name:response.data.name,
                popularity:response.data.popularity,
                previewUrl:response.data.preview_url
              };
              this.getArtist(response.data.artists[0].id,(error,aradata) => {
                trackData['artists'] = [aradata];
                //console.log(trackData);
                callback(null, trackData);
              });
            })
            .catch((error) => {
              if (error.response && error.response.status === 404) {
                callback(new EntityNotFoundError()); // Call callback with an error message
                //throw new EntityNotFoundError('Artist top tracks not found'); // Then throw EntityNotFoundError
              } else {
                callback(new ApiError());
              } 
            });
    }
    searchTracks(query, callback) {
        // web-api/reference/search
        if (!this.accessToken) {
            return callback('Access token not available. Please authenticate first.');
          }
        //console.log(query);
        //if(Number.isInteger(query)){
          let link = `https://api.spotify.com/v1/search?q=${query}&type=track`;
          //console.log(link);
      
          axios
            .get(link, {
              // params: {
              //   q: query,
              //   type: 'track',
              // },
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            }).then((response) => {
              console.log(response.status);
              this.getTrack(response.data.tracks.items[0].id,(error,aradataa) => {
                console.log([aradataa]);
                callback(null, [aradataa]);
              });
            })
            .catch((error) => {
              if (error.response && error.response.status === 404) {
                callback(new EntityNotFoundError()); // Call callback with an error message
                //throw new EntityNotFoundError('Artist top tracks not found'); // Then throw EntityNotFoundError
              } else {
                callback(null, []);
              } 
            });
        // }else{
        //   callback(new ApiError());
        // }
    }
    getArtist(artistId, callback) {
        // web-api/reference/get-an-artist
        if (!this.accessToken) {
            return callback('Access token not available. Please authenticate first.');
          }
      
          axios
            .get(`https://api.spotify.com/v1/artists/${artistId}`, {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            })
            .then((response) => {
              const artistData = {
                artistId: response.data.id,
                followers: response.data.followers.total,
                genres: response.data.genres,
                imageUrl: response.data.images[0]?.url || null,
                name: response.data.name,
                popularity: response.data.popularity,
              };
              callback(null,artistData);
            })
            .catch((error) => {
              if (error.response && error.response.status === 404) {
                callback(new EntityNotFoundError()); // Call callback with an error message
                //throw new EntityNotFoundError('Artist top tracks not found'); // Then throw EntityNotFoundError
              } else {
                callback(new ApiError());
              } 
            });
    }
    getArtistTopTracks(artistId, marketCode, callback) {
        // web-api/reference/get-an-artists-top-tracks
        if (!this.accessToken) {
            return callback('Access token not available. Please authenticate first.');
          }
        let link;
        function validate(marketCode){
          const markets = ["AD", "AE", "AG", "AL", "AM", "AO", "AR", "AT", "AU", "AZ", "BA", "BB", "BD", "BE", "BF", "BG", "BH", "BI", "BJ", "BN", "BO", "BR", "BS", "BT", "BW", "BY", "BZ", "CA", "CD", "CG", "CH", "CI", "CL", "CM", "CO", "CR", "CV", "CW", "CY", "CZ", "DE", "DJ", "DK", "DM", "DO", "DZ", "EC", "EE", "EG", "ES", "ET", "FI", "FJ", "FM", "FR", "GA", "GB", "GD", "GE", "GH", "GM", "GN", "GQ", "GR", "GT", "GW", "GY", "HK", "HN", "HR", "HT", "HU", "ID", "IE", "IL", "IN", "IQ", "IS", "IT", "JM", "JO", "JP", "KE", "KG", "KH", "KI", "KM", "KN", "KR", "KW", "KZ", "LA", "LB", "LC", "LI", "LK", "LR", "LS", "LT", "LU", "LV", "LY", "MA", "MC", "MD", "ME", "MG", "MH", "MK", "ML", "MN", "MO", "MR", "MT", "MU", "MV", "MW", "MX", "MY", "MZ", "NA", "NE", "NG", "NI", "NL", "NO", "NP", "NR", "NZ", "OM", "PA", "PE", "PG", "PH", "PK", "PL", "PS", "PT", "PW", "PY", "QA", "RO", "RS", "RW", "SA", "SB", "SC", "SE", "SG", "SI", "SK", "SL", "SM", "SN", "SR", "ST", "SV", "SZ", "TD", "TG", "TH", "TJ", "TL", "TN", "TO", "TR", "TT", "TV", "TW", "TZ", "UA", "UG", "US", "UY", "UZ", "VC", "VE", "VN", "VU", "WS", "XK", "ZA", "ZM", "ZW"];
          return markets.includes(marketCode)
        };

        if(validate(marketCode)){
          link = `https://api.spotify.com/v1/artists/${artistId}/top-tracks?market=${marketCode}`;
        
        console.log(link);
          axios
            .get(link, {
              // params: {
              //   marketCode: marketCode, // Replace with the desired country code
              // },
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            })
            .then((response) => {
              //thelink = response.data.tracks.id;
              this.getTrack(response.data.tracks[0].id,(error,aradataa) => {
                //console.log([aradataa]);
                callback(null, [aradataa]);
              });
            })
            .catch((error) => {
              if (error.response && error.response.status === 404) {
                callback(new EntityNotFoundError()); // Call callback with an error message
                //throw new EntityNotFoundError('Artist top tracks not found'); // Then throw EntityNotFoundError
              } else {
                callback(new ApiError());
              } 
            });
          }else{
            callback(new ApiError());
          }
          // axios
          // .catch((error) => {
          //   if (error instanceof EntityNotFoundError) {
          //     callback(error.message);
          //   } else if (error.response && error.response.status === 404) {
          //     callback(new EntityNotFoundError('Not Found Error')); // Call callback with an error message
          //     //throw new EntityNotFoundError('Artist top tracks not found'); // Then throw EntityNotFoundError
          //   } else if (error instanceof ApiError) {
          //     callback(new ApiError(error.message));
          //   } 
          // });
    }
    getPlaylist(playlistId, callback) {
        // web-api/reference/get-playlist
        if (!this.accessToken) {
            return callback('Access token not available. Please authenticate first.');
          }
      
          axios
            .get(`https://api.spotify.com/v1/playlists/${playlistId}`, {
              headers: {
                Authorization: `Bearer ${this.accessToken}`,
              },
            })
            .then((response) => {
              const playlistdata = {
                description: response.data.description,
                followers:response.data.followers.total,
                playlistId:response.data.id,
                imageUrl:response.data.images[0].url,
                name:response.data.name,
                owner:{
                  userId: response.data.owner.id
                },
                public:response.data.public,
                //tracks:response.data.tracks
              };
              //console.log(response.data.tracks.items[0].track.id);
              this.getTrack(response.data.tracks.items[0].track.id,(error2,tradata) => {
                playlistdata['tracks'] = [tradata];
                //console.log(playlistdata);
                callback(null,playlistdata);
              });
              //callback(null, playlistdata);
            })
            .catch((error) => {
              if (error.response && error.response.status === 404) {
                callback(new EntityNotFoundError()); // Call callback with an error message
                //throw new EntityNotFoundError('Artist top tracks not found'); // Then throw EntityNotFoundError
              } else {
                callback(new ApiError());
              } 
            });
    }
};

exports.SpotifyApi = SpotifyApi;
