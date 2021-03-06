require "sinatra"
require "sequel"
require "json"
require 'digest/sha2'
require "pry"

enable :sessions

DB = Sequel.sqlite("db.sqlite")

DB.create_table? :entries do
    primary_key :id
    String :name
    String :content
    foreign_key :user_id, :users
    foreign_key :folder_id, :folders
end

DB.create_table? :users do
    primary_key :id
    String :name
    String :pw_hash
end

DB.create_table? :folders do
    primary_key :id
    String :name
    foreign_key :user_id, :users
    foreign_key :folder_id, :folders
end



before do
    # `cd public; make build; cd ..`
end

get "/" do
  "<script>var currentNote = \"\";var currentItem = -1;</script>#{File.read("public/index.html")}"
end

get "/note/:id" do
  content = DB[:entries].first(id: params["id"].to_i)[:content]
  "<script>var currentNote = #{content};var currentItem = #{params["id"]};</script>#{File.read("public/index.html")}"
end


#new entry
def new_entry(params)
  content= JSON.parse(params["content"])

  result = DB[:entries].insert(name: content[0], content: params["content"], user_id: session[:id])
  {id: result}.to_json
end

post "/entries/update" do
  id = params["id"]
  entry = DB[:entries].first(id: id)
  if !session[:id] || id == -1 || entry.nil? || entry[:user_id] != session[:id]
    new_entry(params)
  else
    content = JSON.parse(params["content"])
    DB[:entries].where(id:id).update(name: content[0], content: content.to_json)
    { id: id }.to_json
  end
end

get "/entries/:id" do
  entry = DB[:entries].first(id: params["id"].to_i) || { content: "" }
  JSON.parse(entry[:content]).join(". ").chars.select{ |c|  !(/[\*_\#]/.match(c))}.join
end

get "/login" do
    erb :foo # => "views/foo.erb"
end

post "/authenticate" do
  username = params["username"]
  pw_hash = (Digest::SHA2.new << params["password"]).to_s

  users = DB[:users]
  user = users.where(name: username)

  if user.count == 0
    session[:id]= DB[:users].insert(name: username, pw_hash: pw_hash)
    DB[:folders].insert(name: "root", folder_id: nil)
  else
    user = user.first
    if user[:pw_hash] == pw_hash
      session[:id]= user[:id]
    else
      redirect "/login"
    end
  end

  redirect "/"

end

#get "directory" do
  
