const DATA={
 tier1:["Melbourne City","Melbourne Victory","Sydney FC","Western Sydney Wanderers","Adelaide United","Brisbane Roar","Perth Glory","Newcastle Jets","Central Coast Mariners","Macarthur FC","Wellington Phoenix","Auckland FC","Western United","South Melbourne","Sydney United 58","Brisbane City","Gold Coast Knights","South Hobart"],
 tier2:["APIA Leichhardt","Blacktown City","Marconi Stallions","Rockdale Ilinden","Sydney Olympic","Wollongong Wolves","Avondale","Heidelberg United","Preston Lions","Oakleigh Cannons","Moreton City Excelsior","Olympic FC","Lions FC","Adelaide City","Adelaide Comets","Perth RedStar","Floreat Athena","Canberra Croatia"],
 npl:{East:["Belconnen United","Brindabella Blues","Canberra Croatia","Canberra Olympic","Gungahlin United","Monaro Panthers","O'Connor Knights","Queanbeyan City","Tigers FC","Tuggeranong United"],South:["Altona Magic","Bentleigh Greens","Caroline Springs George Cross","Dandenong City","Dandenong Thunder","Green Gully","Hume City","St Albans Saints","Devonport City","South Hobart Academy"],North:["Eastern Suburbs","Gold Coast United","Gold Coast Knights Academy","Magic United","Moreton City Excelsior Academy","Olympic FC Academy","Peninsula Power","Rochedale Rovers","WDSC Wolves","Brisbane City Academy"],West:["Armadale","Balcatta Etna","Bayswater City","ECU Joondalup","Fremantle City","Inglewood United","Olympic Kingsway","Perth","Stirling Macedonia","Western Knights"]},
 realPlayers:{
  "Melbourne City":["Patrick Beach|GK|21|68","Nuno Reis|CB|34|70","Samuel Souprayen|CB|36|69","Jonas Hall|CB|19|64","Terry Antonis|CM|32|70","Marco Tilio|RW|24|74","Daniel Arzani|LW|27|74","Leo Natel|LW|29|73","Stefan Colakovski|ST|26|71","Steven Ugarkovic|CM|31|72","Nathaniel Atkinson|RB|27|74"],
  "Melbourne Victory":["Roderick Miranda|CB|35|72","Jason Geria|RB|32|72","Ryan Teague|CM|25|75","Daniel Arzani|LW|27|74","Bruno Fornaroli|ST|38|79"],
  "Sydney FC":["Andrew Redmayne|GK|37|73","Rhyan Grant|RB|34|73","Anthony Caceres|CM|33|74","Douglas Costa|RW|35|78","Joe Lolley|RW|33|76","Adrian Segecic|RW|21|72"],
  "Western Sydney Wanderers":["Jack Greenwood|GK|21|65","Kusini Yengi|ST|27|75","Marcus Antonsson|ST|35|73","Calem Nieuwenhof|CM|25|74"],
  "Adelaide United":["Luka Jovanovic|ST|21|74","Craig Goodwin|LW|34|78","Isaías|CM|39|71","Stefan Mauk|CM|30|72"],
  "Perth Glory":["Adam Taggart|ST|33|76","Mark Beevers|CB|36|70","David Williams|ST|37|70"],
  "Auckland FC":["Nando Pijnaker|CB|26|72","Jake Brimmer|CM|28|75","Moses Dyer|ST|28|73"]
 }
};

const WORLD_RARITIES=[
 {name:"Common",chance:55,min:58,max:66},
 {name:"Uncommon",chance:25,min:64,max:71},
 {name:"Rare",chance:12,min:70,max:76},
 {name:"Elite",chance:6,min:75,max:82},
 {name:"World Class",chance:1.8,min:82,max:88},
 {name:"Legendary",chance:0.2,min:88,max:94}
];
const WORLD_NAMES=[
 ["Lionel Messi","AM"],["Cristiano Ronaldo","ST"],["Kylian Mbappé","ST"],["Erling Haaland","ST"],
 ["Jude Bellingham","CM"],["Vinícius Júnior","LW"],["Mohamed Salah","RW"],["Harry Kane","ST"],
 ["Rodri","CM"],["Kevin De Bruyne","CM"],["Lamine Yamal","RW"],["Pedri","CM"],
 ["Bukayo Saka","RW"],["Phil Foden","RW"],["Declan Rice","CM"],["Virgil van Dijk","CB"],
 ["Alisson","GK"],["Thibaut Courtois","GK"],["Son Heung-min","LW"],["Lautaro Martínez","ST"],
 ["Victor Osimhen","ST"],["Khvicha Kvaratskhelia","LW"],["Federico Valverde","CM"],["Florian Wirtz","CAM"],
 ["Cole Palmer","CAM"],["William Saliba","CB"],["Achraf Hakimi","RB"],["Rafael Leão","LW"],
 ["Martin Ødegaard","CAM"],["Jamal Musiala","CAM"],["Nico Williams","LW"],["Rodrigo Hernández","CM"]
];
