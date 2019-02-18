require 'httparty'
require 'json'

API = 'https://parseapi.back4app.com/classes/Pocketmon'
HEADERS = {
    'X-Parse-Application-Id': 'sndrZ8SAfycAadxEdZySp7Z8CY1sypOVAxNczJye',
    'X-Parse-REST-API-Key': 'f1RgPr2fuaLq6Qo44DtHo662tgLNFik0x6Xeeuir',
    'Content-Type': 'application/json'
}

def list_pocketmons
  JSON.parse(HTTParty.get(API, headers: HEADERS).body)['results']
end

def delete_pocketmon(id)
  HTTParty.delete("#{API}/#{id}", headers: HEADERS)
end

pocketmons = []
loop do
  pocketmons = list_pocketmons()
  puts "Deleting page (count: #{pocketmons.length})"
  pocketmons.each do |pkmn|
    puts "Deleting #{pkmn['objectId']}"
    delete_pocketmon(pkmn['objectId'])
  end
  break if pocketmons.empty?
end

