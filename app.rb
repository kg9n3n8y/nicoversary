require 'sinatra'
require 'sinatra/reloader'
require 'uri'
require 'net/http'
require 'json'
require 'date'

def nico_search
	api = "https://api.search.nicovideo.jp/api/v2/snapshot/video/contents/search"
	keywords = ""
	targets = "tags"
	fields = "contentId,title,viewCounter"
	viewcounts = "100000"
	sort = "-viewCounter"
	limit = "100"
	appname = "NiconicoKinenbiSearch"

	year, month, day = Date.today.to_s.split('-')

	date_filter = []
	(2007..year.to_i).each do |y|
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

	url = "#{api}?q=#{keywords}&targets=#{targets}&fields=#{fields}&filters[viewCounter][gte]=#{viewcounts}&jsonFilter=#{json_filter}&_sort=#{sort}&_limit=#{limit}&_context=#{appname}"
	p url

	uri = URI.parse(url)
	res = Net::HTTP.get(uri)
	res_json = JSON.parse(res)

	return res_json["data"]
end

get '/' do
	@movies = nico_search
	slim :index
end