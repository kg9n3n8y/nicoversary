require 'bundler/setup'
require 'sinatra'
require 'uri'
require 'net/http'
require 'json'
require 'date'
# require 'sinatra/reloader'

def nico_search(year, month, day ,tag)
	api = "https://api.search.nicovideo.jp/api/v2/snapshot/video/contents/search"
	keyword = URI.encode_www_form_component(tag)
	start_year = 2007
	targets = "tagsExact"
	fields = "contentId,title,startTime,thumbnailUrl,viewCounter,commentCounter"
	viewcounts = "10000"
	sort = "-viewCounter"
	limit = "100"
	appname = "Nicoversary"

	date_filter = []
	(start_year..year.to_i).each do |y|
		date_filter << {
			"type": "range",
			"field": "startTime",
			"from": "#{y}-#{month}-#{day}T00:00:00+09:00",
			"to": "#{y}-#{month}-#{day}T23:59:59+09:00",
			"include_lower": true
		}
	end

	json_filter = { "type": "or", "filters": date_filter}.to_json

	json_filter = URI.encode_www_form_component(json_filter)

	url = "#{api}?q=#{keyword}&targets=#{targets}&fields=#{fields}&filters[viewCounter][gte]=#{viewcounts}&jsonFilter=#{json_filter}&_sort=#{sort}&_limit=#{limit}&_context=#{appname}"
	uri = URI.parse(url)
	res = Net::HTTP.get(uri)
	res_json = JSON.parse(res)

	return res_json["data"]
end

get '/*/*/*/*' do |year, month, day, tag|
	@tag = tag
	@year = year.to_i
	redirect to('/') if @year < 2008
	@month = month.to_i
	@day = day.to_i
	@movies = nico_search(@year, @month, @day ,tag)
	slim :index
end

get '/*' do |tag|
	@tag = tag
	@year = Date.today.year
	@month = Date.today.month
	@day = Date.today.day
	@movies = nico_search(@year, @month, @day ,tag)
	slim :index
end