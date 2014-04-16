/** @jsx React.DOM */

var _ = require('underscore');

var BlurInput = require("./blur-input.jsx");

var Editor = React.createClass({
    getInitialState: function() {
    var defaults = [];
	if (!localStorage["has_seen_page"]) {
	defaults = ["# Welcome to swagNotes",
				"Click on any of the sections to start editing the markdown",
				"### Features", "* *Standard* **Markdown** syntax\n* Useful keyboard controls (try Tab and Shift-Tab!)\n* Cram mode (click the arrow at the top!)", "Visit [this page](/login) to create an account or log in", "Click 'Save' below to get a URL for your notes", "Refresh this page to clear this message and get a clean slate!"];
    localStorage["has_seen_page"] = true;

	}

        return {
            values: currentNote || defaults,
            showingSpritz: false,
            myId: null,
            lastSaved: null,
            saving: false,
            timesOpened: 0
        }
    },

    render: function() {
        return <div>
            {!this.state.showingSpritz && <div 
                className="cram-button"
                onClick={() => {
                    var self = this;
                    this.setState({
                        showingSpritz: true,
			timesOpened: this.state.timesOpened + 1
                    });
                    $("#spritz").slideDown();
                    $.post("/entries/update", {
        content: JSON.stringify(this.state.values),
        id: currentItem
      },
      function(result) {
                        var json = JSON.parse(result);
			currentItem = result.id;
                        SpritzClient.fetchContents("http://107.170.192.223/entries/" + json.id, function (spritzText) {
                            $(".spritzer").data("controller").startSpritzing(spritzText);
                        }, function() {});
                    });
                }}>
                <i className="fa fa-chevron-down" />
            </div>}
            {this.state.showingSpritz && <div 
                className="cram-button"
                onClick={() => {
                    $("#spritz").slideUp();
                    this.setState({
                        showingSpritz: false
                    });
            }}>
		{this.state.timesOpened < 3 && <i className="fa fa-chevron-up" />}
		{this.state.timesOpened >= 3 && <span>:<i className="fa fa-chevron-up" />)</span>}
            </div>}
            <div className="document">
                {_.map(this.state.values, (value, i) =>
                       <Paragraph
                           value={value}
                           ref={"paragraph"+i}
                           key={i}
                           onChange={this.changeValue(i)} 
                           onPrev={this.prev(i)}
                           onSplit={this.split(i)}
                           onBackspace={this.backspace(i)}
                           onNext={this.next(i)} />
                       )}
                <div className="add-wrapper">
                   <div
                       className="add"
                       onClick={this.addNew}>+</div>
                </div>
                <div className="add"
                    onClick={this.handleSave}>Save</div>
            {this.state.saving &&
                <div>Saving...</div>}
            {currentItem !== -1 && currentItem&&
                <div className="share">Share this note with friends at:{" "}
<a href={"http://swagnotes.net/note/" + currentItem}>swagnotes.net/note/{currentItem}</a></div>}
		<div className="about"><a target="_blank" href="http://swagnotes.net/note/36">About</a></div>
           </div>
        </div>;
    },
    split: function(i) {
        return (left, right) => {
            if (left === "") return;
            var newValues = _.clone(this.state.values);

            if (left.match(/(^|\n)\s*\* .*$/) && (right.match(/\* /) || right === "")) {
                newValues[i] = left + "\n" + right;
                this.setState({
                    values: newValues
                });
                return;
            }

            newValues[i] = right;
            newValues.splice(i, 0, left.trim());

            this.setState({
                values: newValues
            }, () => {
                this.refs["paragraph"+(i+1)].open(0);
            });
        };
    },
    backspace: function(i) {
        return (value) => {
            if (i === 0) return;
            var newValues = _.clone(this.state.values);
            var oldLength = newValues[i - 1].length;
            newValues[i - 1] += value;
            newValues.splice(i,1);
            this.setState({
                values: newValues
            }, () => {
                this.refs["paragraph"+(i-1)].open(oldLength);
            });
        };
    },
    handleSave: function() { 
        var self = this;
        this.setState({
            saving: true
        });
           $.post("/entries/update", {
      content: JSON.stringify(this.state.values),
      id: currentItem
    }, function(result) {
            var json = JSON.parse(result);
            currentItem = json.id;
            self.setState({
                lastSaved: json.id,
                saving: false
            });
        });
    },
    addNew: function() {
        this.setState({
            values: this.state.values.concat([""])
        }, () => {
            this.refs["paragraph"+(this.state.values.length - 1)].open();
        });
    },
    changeValue: function(i) {
        return (value) => {
            var newValues = _.clone(this.state.values);
            newValues[i] = value;
            if (newValues[i] === "") {
                newValues.splice(i, 1);
            }
            this.setState({
                values: newValues // _.filter(newValues, (value) => value !== "")
            });
        };
    },
    next: function(i) {
        return (value) => {
            this.jumpFromTo(i, i + 1, value);
        };
    },
    prev: function(i) {
        return (value) => {
            this.jumpFromTo(i, i - 1, value);
        };
    },
    jumpFromTo: function(from, to, value) {
        var newValues = _.clone(this.state.values);
        newValues[from] = value;
        newValues = _.filter(newValues, (value) => value !== "");
        if (to < newValues.length) {
            this.setState({
                values: newValues
            }, () => {
                var c = this.state.values.length;
                this.refs["paragraph" + Math.max(to,0)].open();
            });
        } else {
            this.setState({
                values: newValues.concat([""])
            }, () => {
                this.refs["paragraph"+(this.state.values.length-1)].open();
            });
        }
    }
});

var Paragraph = React.createClass({
    open: function(cursorPos) {
        this.setState({
            editing: true
        }, () => {
            var node = this.refs.editor.getDOMNode()
            node.focus();
            if (cursorPos == null) {
                node.selectionStart = node.value.length;
                node.selectionEnd = node.value.length;
            } else {
                node.selectionStart = cursorPos;
                node.selectionEnd = cursorPos;
            }
        });
    },

    getInitialState: function() {
        return {
            editing: false
        };
    },

    getDefaultProps: function() {
        return {
            value: "test"
        };
    },

    render: function() {
        if (this.state.editing) {
            return <div className="paragraph-wrapper">
                <BlurInput
                    className="paragraph"
                    ref="editor"
                    type="text"
                    value={this.props.value}
                    onPrev={(value) => {
                        this.setState({
                            editing: false
                        });
                        this.props.onPrev(value);
                    }}
                    onNext={(value) => {
                        this.setState({
                            editing: false
                        });
                        this.props.onNext(value);
                    }}
                    onChange={(e) => {
                        this.setState({
                            editing: false
                        });
                        this.props.onChange(e);
                    }}
                    onSplit={this.props.onSplit}
                    onBackspace={this.props.onBackspace}
                />
            </div>
        } else {
            return <div className="paragraph-wrapper"
                        onClick={this.startEditor} >
                <div className="paragraph">
                    {markedReact(this.props.value)}
                </div>
            </div>;
        }
    },

    startEditor: function() {
        this.setState({
            editing: true
        }, function() {
            this.refs.editor.getDOMNode().focus();
        });
    }
});

React.renderComponent(<Editor />, document.getElementById("app"));
