require "sinatra"
require "sequel"
require "json"

DB = Sequel.sqlite("db.sqlite")

DB.create_table? :entries do
    primary_key :id
    String :content
end

before do
    `cd public; make build; cd ..`
end

get "/" do
  "<script>var currentNote = \"\";</script>#{File.read("public/index.html")}"
end

get "/note/:id" do
  content = DB[:entries].first(id: params["id"].to_i)[:content]
  "<script>var currentNote = #{content};</script>#{File.read("public/index.html")}"
end

get "/entries/new" do
    result = DB[:entries].insert(content: params["content"])
    {id: result}.to_json
end

get "/entries/:id" do
    JSON.parse(DB[:entries].first(id: params["id"].to_i)[:content]).join("\n\n")
end
