
/* Services */

function TarballFactory() {
    return function () {
        function Tarball() {
            var tf = this;
            // var JSZip = require("jszip");
            var zip = new JSZip();;
            tf.append = function (file_name, content) {
                zip.file(file_name, content)
            };
            tf.get_url = function (n) {
                return new Promise(function (resole, reject) {
                    zip.generateAsync({ type: "base64" }).then(function (base64) {
                        console.log('get_url');
                        // saveAs(base64, "hello.zip");

                        resole("data:application/zip;base64," + base64);
                    }, function (err) {
                        console.log('Something wrong!!!');
                    });
                });

            };
        }
        return new Tarball();
    };
}
function ModelRenderFactory() {
    return function (built_in_models) {
        var _this = this;
        _this.built_in_models = built_in_models;
        _this.spaces = function (n) {
            var _n = n || 1;
            return new Array(_n + 1).join(" ");
        };
        _this.model_names = function (models, suffix) {
            var _suffix = suffix || '';
            return Object.keys(models).map(function (k) {
                return models[k].name + _suffix;
            });
        };
        _this.new_lines = function (n) {
            var _n = n || 1;
            return new Array(_n + 1).join("\n");
        };
        _this.unicode = function (django2) {
            return django2 ? '' : '# -*- coding: utf-8 -*-\n';
        }
        _this.render_all = function (app_name, models, django2) {
            // Primary used for testing
            var all_output = '';
            all_output += _this.render_base_html(app_name, models);
            all_output += _this.render_forms_py(app_name, models, django2);
            all_output += _this.render_urls_py(app_name, models, django2);
            all_output += _this.render_admin_py(app_name, models);
            all_output += _this.render_views_py(app_name, models, django2);
            all_output += _this.render_templates_html(model_name, models);
            return all_output;
        };
        _this.render_base_html = function (app_name, models) {
            return '<html><head></head><body>{% block content %}Replace this.{% endblock %}</body>';
        };
        _this.pre_imported_modules = function (n) {
            return {
                // module, import as
                'django.contrib.auth.models': { as: 'auth_models' },
                'django.db.models': { as: 'models' },
                'django_extensions.db.fields': { as: 'extension_fields' }
            };
        };
        _this.pre_imported_modules_names = function (n) {
            return Object.keys(_this.pre_imported_modules());
        };
        _this.render_forms_py = function (app_name, models) {
            var forms_py = 'from django import forms\n';
            forms_py += 'from django.db import models\n';
            forms_py += 'from django.forms import modelform_factory\n';
            forms_py += 'from bootstrap_datepicker_plus import DatePickerInput\n';
            forms_py += 'from .models import ' + _this.model_names(models, '').join(', ') + '\n';
            forms_py += _this.new_lines(2);
            forms_py += 'def set_widget(f):\n';
            forms_py += _this.spaces(4) + 'if isinstance(f, models.DateField):\n';
            forms_py += _this.spaces(8) + 'formfield = f.formfield()\n';
            forms_py += _this.spaces(8) + 'formfield.widget = DatePickerInput(options={"format": "DD/MM/YYYY"})\n';
            forms_py += _this.spaces(8) + 'return formfield\n';
            forms_py += _this.spaces(4) + 'else:\n';
            forms_py += _this.spaces(8) + 'return f.formfield()\n';
            forms_py += _this.new_lines(2);

            jQuery.each(models, function (i, model) {
                forms_py += model.render_forms(app_name, _this);
            });

            return forms_py;
        };

        _this.render_urls_py = function (app_name, models, django2) {
            var urls_py = '';
            var path_import = django2 ? 'path' : 'url';
            if (django2) {
                urls_py += 'from django.urls import path, include\n';
            } else {
                urls_py += 'from django.conf.urls import url, include\n';
            }
            urls_py += 'from . import views' + _this.new_lines(2);


            jQuery.each(models, function (i, model) {
                urls_py += model.render_urls(app_name, _this, django2);
            });

            return urls_py;
        };

        _this.render_views_py = function (app_name, models, django2) {
            var views_py = _this.unicode(django2);
            views_py += 'from django.contrib import messages\n';
            views_py += 'from django.contrib.auth.decorators import login_required\n';
            views_py += 'from django.shortcuts import render, get_object_or_404, redirect\n';
            views_py += _this.new_lines(1);
            views_py += 'from .models import ' + _this.model_names(models).join(', ') + '\n';
            views_py += 'from .forms import ' + _this.model_names(models, 'Form').join(', ') + ','
                + _this.model_names(models, 'SearchForm').join(', ');
            views_py += _this.new_lines(2);

            jQuery.each(models, function (i, model) {
                views_py += model.render_view_funcs(app_name, model, _this);
            });

            return views_py;
        };

        _this.render_admins_py = function (app_name, models) {
            var views_py = 'from django.contrib import admin\n';
            views_py += 'from .models import ' + _this.model_names(models).join(', ');
            views_py += _this.new_lines(2);

            jQuery.each(models, function (i, model) {
                views_py += 'admin.site.register(' + model.name + ')\n';
            });

            return views_py;
        };

        _this.render_templates_html = function (app_name, models) {
            var templates = [];
            templates.push(['base.html', models[0].render_base_html()]);

            jQuery.each(models, function (i, model) {
                templates.push([model.l_name() + '_form.html', model.render_form_html(app_name)]);
                templates.push([model.l_name() + '_view.html', model.render_view_html(app_name)]);
                templates.push([model.l_name() + '_index.html', model.render_index_html(app_name)]);
                templates.push([model.l_name() + '_create.html', model.render_create_html(app_name)]);
                templates.push([model.l_name() + '_update.html', model.render_update_html(app_name)]);

            });

            return templates;
        };


    };
}
function MessageServiceFactory() {
    return function () {
        var _this = this;
        _this.base_modal = function () {
            /*
             <div class="modal fade">
             <div class="modal-dialog">
             <div class="modal-content">
             <div class="modal-header">
             <button type="button" class="close" data-dismiss="modal" aria-hidden="true">&times;</button>
             <h4 class="modal-title">Modal title</h4>
             </div>
             <div class="modal-body">
             <p>One fine body&hellip;</p>
             </div>
             <div class="modal-footer">
             <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
             <button type="button" class="btn btn-primary">Save changes</button>
             </div>
             </div><!-- /.modal-content -->
             </div><!-- /.modal-dialog -->
             </div><!-- /.modal -->
             */
            var base = jQuery('<div>').addClass("modal fade");
            base.attr("tabindex", "-1");
            base.attr("role", "dialog");
            base.css("display", "none");

            var modal_dialog = jQuery('<div>').addClass("modal-dialog");
            var modal_content = jQuery('<div>').addClass("modal-content").appendTo(modal_dialog);
            var modal_header_inner = jQuery('<h2>').addClass("modal-header-inner");
            jQuery('<div>').addClass("modal-header").appendTo(modal_content).append(modal_header_inner);
            jQuery('<div>').addClass("modal-body").appendTo(modal_content);
            jQuery('<div>').addClass("modal-footer").appendTo(modal_content);

            base.append(modal_dialog);

            return base;
        };
        _this.icon = function (icon_name) {
            return jQuery('<icon>').addClass('fa').addClass(icon_name);
        };
        _this.simple_error = function (title, message) {
            var simple_error = _this.base_modal().addClass("django_builder_simple_error");
            var i = _this.icon('fa-info').addClass('pull-right');
            simple_error.find(".modal-header-inner").append(i).append(jQuery('<span>').text(title));
            simple_error.find(".modal-body").empty().append(message);
            var ok_button = jQuery('<button>').addClass('btn btn-default').text('Ok');
            simple_error.find(".modal-footer").append(ok_button);
            ok_button.attr("data-dismiss", "modal");
            simple_error.modal();
            return simple_error;
        };
        _this.simple_info = function (title, message) {
            var simple_info = _this.base_modal();
            var i = _this.icon('fa-info').addClass('pull-right');
            simple_info.find(".modal-header-inner").append(i).append(jQuery('<span>').text(title));
            simple_info.find(".modal-body").empty().append(message);
            var ok_button = jQuery('<button>').addClass('btn btn-default').text('Ok');
            simple_info.find(".modal-footer").append(ok_button);
            ok_button.attr("data-dismiss", "modal");
            simple_info.modal();
            return simple_info;
        };
        _this.simple_confirm = function (title, message, callback) {
            var _callback = callback || jQuery.noop;
            var simple_confirm = _this.base_modal();
            simple_confirm.find(".modal-header-inner").html(title);
            simple_confirm.find(".modal-body").empty().append(message);
            var confirm_button = jQuery('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = jQuery('<button>').addClass('btn btn-default').text('Cancel');
            simple_confirm.find(".modal-footer").append(confirm_button).append(cancel_button);
            confirm_button.click(function () {
                _callback();
            });
            cancel_button.attr("data-dismiss", "modal");
            confirm_button.attr("data-dismiss", "modal");
            simple_confirm.modal();
            return simple_confirm;
        };
        _this.simple_choice = function (title, message, choices) {
            var simple_choice = _this.base_modal();
            simple_choice.find(".modal-header-inner").html(title);
            simple_choice.find(".modal-body").empty().append(message);
            jQuery.each(choices, function (i, choice) {
                var choice_button = jQuery('<button>').addClass('btn btn-primary').text(choice['text']);
                simple_choice.find(".modal-footer").append(choice_button);
                choice_button.click(function () {
                    choice['callback']();
                });
                choice_button.attr("data-dismiss", "modal");
            });
            simple_choice.modal();
            return simple_choice;
        };
        _this.simple_form = function (title, message, form, callback, no_dismiss) {
            var _callback = callback || jQuery.noop;
            var _no_dismiss = no_dismiss || true;
            var simple_confirm = _this.base_modal();
            simple_confirm.find(".modal-header-inner").html(title);
            simple_confirm.find(".modal-body").empty().append(message).append(form);
            var confirm_button = jQuery('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = jQuery('<button>').addClass('btn btn-default').text('Cancel');
            simple_confirm.find(".modal-footer").append(confirm_button).append(cancel_button);
            confirm_button.click(function () {
                if (!_no_dismiss) {
                    simple_confirm.modal('hide');
                }
                _callback(form);
            });
            cancel_button.attr("data-dismiss", "modal");
            if (!_no_dismiss) {
                confirm_button.attr("data-dismiss", "modal");
            }
            simple_confirm.modal();
            return simple_confirm;
        };
        _this.simple_form_no_dismiss = function (title, message, form, callback) {
            return _this.simple_form(title, message, form, callback, true);
        };
        _this.simple_input = function (title, message, default_value, callback, required) {
            var _callback = callback || jQuery.noop;
            var _required = required || false;
            var simple_input = _this.base_modal();
            simple_input.find(".modal-header-inner").html(title);
            var label = jQuery('<label>').text(message);
            var input = jQuery('<input>').attr('type', 'text').attr('name', 'input').addClass('form-control').attr('value', default_value);
            var input_help = jQuery('<span>').text('error message').addClass('help-block hide');
            var input_group = jQuery('<div>').addClass('form-group form-group-input has-feedback').append(label).append(input).append(input_help);
            var submit_handler = function () {
                var _input = input.val();
                if (_required && (_input == '' || input == undefined)) {
                    input_group.addClass('has-error')
                        .append(jQuery('<i>').addClass("fa fa-times form-control-feedback"))
                        .find('.help-block').removeClass('hide').text('Field Required');
                } else {
                    simple_input.modal('hide');
                    _callback(_input);
                }
            };
            var input_form = jQuery('<form>').append(input_group).submit(function (event) {
                event.preventDefault();
                submit_handler();
            });
            simple_input.find(".modal-body").empty().append(input_form);
            var confirm_button = jQuery('<button>').addClass('btn btn-primary').text('Ok');
            var cancel_button = jQuery('<button>').addClass('btn btn-default').text('Cancel');
            simple_input.find(".modal-footer").append(confirm_button).append(cancel_button);

            confirm_button.click(submit_handler);
            cancel_button.attr("data-dismiss", "modal");
            if (!_required) { confirm_button.attr("data-dismiss", "modal"); }
            simple_input.modal();
            return simple_input;
        };
    };
}
function RelationshipFactory() {
    return function (options) {
        var _this = this;
        _this.relationship_types = function () {
            return [
                'django.db.models.ForeignKey',
                'django.db.models.OneToOneField',
                'django.db.models.ManyToManyField'
            ];
        };
        _this.relationship_matches = function () {
            return _this.relationship_types + [
                'ForeignKey',
                'OneToOneField',
                'ManyToManyField',
                'models.ForeignKey',
                'models.OneToOneField',
                'models.ManyToManyField'
            ]
        };
        _this.relationship_match = function (rel) {
            return _this.relationship_matches().indexOf(rel) != -1;
        };
        function Relationship(options) {
            this.name = options['name'];
            this.type = options['type'];
            this.opts = options['opts'];
            this.to = options['to'];

            this.external_app = options['external_app'] || false;
            this.extractFirst = function (str) {
                var matches = str.match(/["'](.*?)["']/);
                return matches ? matches[1] : null;
            };
            this.verboseName = this.extractFirst(this.opts) || this.name;
            this.class_name = function () {
                return this.type.split('.').reverse()[0]
            };
            this.form_update = function (form) {
                this.name = jQuery(form).find('input[name=name]').val();
                this.type = jQuery(form).find('select[name=type]').val();
                this.opts = jQuery(form).find('input[name=opts]').val();
                this.to = jQuery(form).find('input[name=to]').val();
            };
            this.to_clean = function () {
                return this.to.replace(/['"]+/g, '')
            };
            this.to_class = function () {
                return this.to.split('.').reverse().shift();
            };
            this.opts_args = function () {
                return this.opts.split(',').join(', ');
            };
            this.to_module = function () {
                var split = this.to.split('.');
                return split.slice(0, split.length - 1).join('.');
            };
            this.module = function () {
                var split = this.type.split('.');
                return split.slice(0, split.length - 1).join('.');
            };
            this.edit_form = function ($scope) {
                var form = jQuery('<form>');
                var form_div1 = jQuery('<div>').addClass('form-group form-group-name has-feedback').appendTo(form);
                var form_div2 = jQuery('<div>').addClass('form-group form-group-type').appendTo(form);
                var form_div3 = jQuery('<div>').addClass('form-group form-group-args').appendTo(form);
                var form_div4 = jQuery('<div>').addClass('form-group form-group-args').appendTo(form);
                form_div1.append(jQuery('<label>').text('Name'));
                form_div1.append(jQuery('<input>').attr('name', 'name').addClass('form-control').val(this.name));
                form_div1.append(jQuery('<span>').text('error message').addClass('help-block hide'));

                form_div2.append(jQuery('<label>').text('To'));
                form_div2.append(jQuery('<input>').attr('name', 'to')
                    .attr('placeholder', 'to').addClass('form-control').val(this.to));

                var select = jQuery('<select>').attr('name', 'type').addClass('form-control');
                var that = this;
                jQuery.each($scope.relationship_factory.relationship_types(), function (i, field_type) {
                    var input = jQuery('<option>').attr('val', field_type).text(field_type);
                    if (field_type == that.type) {
                        input.attr('selected', 'selected');
                    }
                    select.append(input);
                });
                form_div3.append(jQuery('<label>').text('Field Type'));
                form_div3.append(select);
                form_div4.append(jQuery('<label>').text('Arguments'));
                form_div4.append(jQuery('<input>').attr('name', 'opts')
                    .attr('placeholder', 'options').addClass('form-control').val(this.opts));
                return form;
            };
        }
        _this.make_relationship = function (options) {
            return new Relationship(options);
        }
    };
}
function FieldFactory() {
    return function (options) {
        var _this = this;
        _this.fields = function () {
            return {
                'django.db.models.TextField': { default_args: 'max_length=100' },
                'django.db.models.CharField': { default_args: 'max_length=30' },
                'django.contrib.contenttypes.fields.GenericForeignKey': { default_args: '\"content_type\", \"object_id\"' },
                'django_extensions.db.fields.AutoSlugField': {},
                'django.contrib.postgres.fields.ArrayField': { default_args: 'models.CharField(max_length=100)' },
                'django.contrib.postgres.fields.CICharField': { default_args: 'max_length=30' },
                'django.contrib.postgres.fields.CIEmailField': {},
                'django.contrib.postgres.fields.CITextField': {},
                'django.contrib.postgres.fields.HStoreField': {},
                'django.contrib.postgres.fields.JSONField': { default_args: 'default=dict' },
                'django.contrib.postgres.fields.ranges.IntegerRangeField': {},
                'django.contrib.postgres.fields.ranges.BigIntegerRangeField': {},
                'django.contrib.postgres.fields.ranges.FloatRangeField': {},
                'django.contrib.postgres.fields.ranges.DateTimeRangeField': {},
                'django.contrib.postgres.fields.ranges.DateRangeField': {},
                'django.db.models.CommaSeparatedIntegerField': {},
                'django.db.models.BigAutoField': {},
                'django.db.models.BigIntegerField': {},
                'django.db.models.BooleanField': {},
                'django.db.models.DateField': {},
                'django.db.models.DateTimeField': {},
                'django.db.models.DecimalField': { default_args: 'max_digits=10, decimal_places=2' },
                'django.db.models.DurationField': {},
                'django.db.models.FileField': { default_args: 'upload_to=\"/upload/files/\"' },
                'django.db.models.ImageField': { default_args: 'upload_to=\"/upload/images/\"' },
                'django.db.models.FilePathField': {},
                'django.db.models.FloatField': {},
                'django.db.models.IntegerField': {},
                'django.db.models.PositiveIntegerField': {},
                'django.db.models.PositiveSmallIntegerField': {},
                'django.db.models.SlugField': {},
                'django.db.models.IPAddressField': {},
                'django.db.models.GenericIPAddressField': {},
                'django.db.models.NullBooleanField': {},
                'django.db.models.TimeField': {},
                'django.db.models.BinaryField': {},
                'django.db.models.AutoField': {},
                'django.db.models.SmallIntegerField': {},
                'django.db.models.URLField': {},
                'django.db.models.UUIDField': {},
                'django.db.models.EmailField': {}
            };
        };
        _this.default_field_args = function (field_type) {
            var _field = _this.fields()[field_type];
            if (_field && _field['default_args']) { return _field['default_args'] }
            return '';
        };
        _this.field_types = function () {
            return Object.keys(_this.fields());
        };
        function Field(options) {
            this.name = options['name'];
            this.type = options['type'];
            this.opts = options['opts'] || '';
            this.extractFirst = function (str) {
                var matches = str.match(/["'](.*?)["']/);
                return matches ? matches[1] : null;
            };
            this.verboseName = this.extractFirst(this.opts) || this.name;
            this.class_name = function () {
                return this.type.split('.').reverse()[0]
            };
            this.opts_args = function () {
                return this.opts.split(',').join(', ');
            };
            this.to_clean = function () {
                return this.to.replace(/['"]+/g, '')
            };
            this.module = function () {
                var split = this.type.split('.');
                return split.slice(0, split.length - 1).join('.');
            };
            this.form_update = function (form) {
                this.name = jQuery(form).find('input[name=name]').val();
                this.type = jQuery(form).find('select[name=type]').val();
                this.opts = jQuery(form).find('input[name=opts]').val();
            };
            this.edit_form = function ($scope) {
                var form = jQuery('<form>');
                var form_div1 = jQuery('<div>').addClass('form-group form-group-name has-feedback').appendTo(form);
                var form_div2 = jQuery('<div>').addClass('form-group form-group-type').appendTo(form);
                var form_div3 = jQuery('<div>').addClass('form-group form-group-args').appendTo(form);
                form_div1.append(jQuery('<label>').text('Name'));
                form_div1.append(jQuery('<input>').attr('name', 'name').addClass('form-control').val(this.name));
                form_div1.append(jQuery('<span>').text('error message').addClass('help-block hide'));
                var select = jQuery('<select>').attr('name', 'type').addClass('form-control');
                var that = this;
                jQuery.each($scope.field_factory.field_types(), function (i, field_type) {
                    var input = jQuery('<option>').attr('val', field_type).text(field_type);
                    if (field_type == that.type) {
                        input.attr('selected', 'selected');
                    }
                    select.append(input);
                });
                form_div2.append(jQuery('<label>').text('Field Type'));
                form_div2.append(select);
                form_div3.append(jQuery('<label>').text('Arguments'));
                form_div3.append(jQuery('<input>').attr('name', 'opts')
                    .attr('placeholder', 'options').addClass('form-control').val(this.opts));
                return form;
            };
        }
        _this.make_field = function (options) {
            return new Field(options);
        }
    };
}
function ModelServiceFactory() {
    return function (options, $scope, http) {
        function Model(options, http) {
            var _this = this;
            _this.http = http;
            _this.form = '';
            _this.create = '';
            _this.update = '';
            _this.index = '';
            _this.view = '';
            _this.base = '';

            _this.http.get('app/partials/views/_form.html').then(function (e) { _this.form = e.data });
            _this.http.get('app/partials/views/create.html').then(function (e) { _this.create = e.data });
            _this.http.get('app/partials/views/update.html').then(function (e) { _this.update = e.data });
            _this.http.get('app/partials/views/index.html').then(function (e) { _this.index = e.data });
            _this.http.get('app/partials/views/view.html').then(function (e) { _this.view = e.data });
            _this.http.get('app/partials/views/base.html').then(function (e) { _this.base = e.data });


            _this.replace_in_template = function (template, replacements) {
                jQuery.each(replacements, function (i, repl) {
                    template = template.replace(new RegExp(repl[0], 'g'), repl[1]);
                });
                return template;
            };

            this.slugify = function (text) {
                return text.toString()
                    .replace(/\s+/g, '')            // Replace spaces with _
                    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
                    .replace(/\-\-+/g, '')          // Replace multiple - with single _
                    .replace(/^-+/, '')             // Trim - from start of text
                    .replace(/-+$/, '');            // Trim - from end of text
            };
            this.set_name = function (raw_name) {
                this.name = this.slugify(raw_name);
            };
            this.set_name(options['name']);
            this.displayName = options['displayName'];
            this.fields = [];
            this.fields = (options['fields'] || []).map($scope.field_factory.make_field);
            this.relationships = (options['relationships'] || []).map($scope.relationship_factory.make_relationship);
            this.relationship_names = function () {
                var that = this;
                return Object.keys(that.relationships).map(function (k) {
                    return that.relationships[k].name
                });
            };
            this.field_names = function () {
                var that = this;
                return Object.keys(that.fields).map(function (k) {
                    return that.fields[k].name
                });
            };
            this.l_name = function () {
                return this.name.toLowerCase()
            };

            this.has_relationship = function (relationship_name) {
                return this.relationship_names().indexOf(relationship_name) != -1;
            };
            this.has_field = function (field_name) {
                return this.field_names().indexOf(field_name) != -1;
            };
            this.name_field = function () {
                // TODO - find another auto_add_now_field
                if (this.field_names().indexOf('name') != -1) {
                    return 'name';
                } else {
                    return 'pk';
                }
            };
            this.ordering_field = function () {
                // TODO - find another auto_add_now_field
                if (this.field_names().indexOf('created') != -1) {
                    return 'created';
                } else {
                    return 'pk';
                }
            };
            this.identifier = function () {
                // TODO - find another name AutoSlugField
                if (this.field_names().indexOf('slug') != -1) {
                    return 'slug';
                } else {
                    return 'id';
                }
            };
            this.identifier_is_slug = function () {
                // TODO - find another name AutoSlugField
                if (this.field_names().indexOf('slug') != -1) {
                    return true;
                } else {
                    return false;
                }
            };
            this.render_forms = function (app_name, renderer) {
                var form = '';

                form += 'class ' + _this.name + 'SearchForm(forms.Form):\n';
                jQuery.each(_this.fields, function (i, field) {
                    form += renderer.spaces(4) + field.name + ' = forms.' + field.type + '(\n';
                    form += renderer.spaces(8) + "label='" + field.verboseName + "',\n";
                    form += renderer.spaces(8) + 'required=False,\n';
                    form += renderer.spaces(4) + ')\n';
                    form += renderer.new_lines(1);
                });

                jQuery.each(_this.relationships, function (i, relationship) {
                    form += renderer.spaces(4) + relationship.name + ' = forms.ModelChoiceField(\n';
                    form += renderer.spaces(8) + "label='" + relationship.verboseName + "',\n";
                    form += renderer.spaces(8) + 'queryset=' + relationship.to + '.objects.all(),\n';
                    form += renderer.spaces(8) + 'required=False,\n';
                    form += renderer.spaces(8) + "empty_label='Tất cả',\n";
                    form += renderer.spaces(4) + ')\n';
                    form += renderer.new_lines(1);
                });

                form += renderer.new_lines(2);
                form += _this.name + 'Form = modelform_factory(\n';
                form += renderer.spaces(4) + _this.name + ',\n';
                form += renderer.spaces(4) + 'fields=(\n';
                jQuery.each(_this.fields, function (i, field) {
                    form += renderer.spaces(8) + "'" + field.name + "',\n";
                });
                jQuery.each(_this.relationships, function (i, relationship) {
                    form += renderer.spaces(8) + "'" + relationship.name + "',\n";
                });
                form += renderer.spaces(4) + '),\n';
                form += renderer.spaces(4) + 'formfield_callback=set_widget\n';
                form += ')\n';
                form += renderer.new_lines(2);

                return form;
            };
            this.get_initial_data = function (app_name, renderer) {
                var initial = '{';
                initial += renderer.new_lines(1);
                jQuery.each(this.readable_fields(), function (i, field) {
                    initial += renderer.spaces(12) + '\"' + field.name + '\": \"' + field.name + '\",';
                    initial += renderer.new_lines(1);
                });
                jQuery.each(this.relationships, function (i, relationship) {
                    initial += renderer.spaces(12) + '\"' + relationship.name + '\": create_' + relationship.to.toLowerCase().replace(/\./g, '_') + '().pk,';
                    initial += renderer.new_lines(1);
                });
                initial += renderer.spaces(8) + '}';
                return initial;
            };

            this.render_urls = function (app_name, renderer, django2) {
                var urls = '';
                var path_import = django2 ? 'path' : 'url';

                urls += 'urlpatterns += (\n';
                urls += renderer.spaces(4) + '# urls for ' + this.name + '\n';
                var namePrefix = app_name + '.' + this.l_name();
                var indexUrl = "views." + this.l_name() + "_index, name='" + namePrefix + ".index'),\n";
                var createUrl = "views." + this.l_name() + "_create, name='" + namePrefix + ".create'),\n";
                var updateUrl = "views." + this.l_name() + "_update, name='" + namePrefix + ".update'),\n";
                var viewUrl = "views." + this.l_name() + "_view, name='" + namePrefix + ".view'),\n";
                var deleteUrl = "views." + this.l_name() + "_delete, name='" + namePrefix + ".delete'),\n";

                if (django2) {
                    var prefix = renderer.spaces(4) + path_import + '(\'' + this.l_name();
                    if (this.identifier_is_slug()) {
                        var url_identifier = '<slug:' + this.identifier() + '>'
                    } else {
                        var url_identifier = '<int:' + this.identifier() + '>'
                    }

                    urls += prefix + "/'," + indexUrl;
                    urls += prefix + '/create/\',' + createUrl;
                    urls += prefix + '/update/' + url_identifier + "'," + updateUrl;
                    urls += prefix + '/view/' + url_identifier + "'," + viewUrl;
                    urls += prefix + '/delete/' + url_identifier + "'," + deleteUrl;
                } else {
                    var prefix = renderer.spaces(4) + path_import + '(r\'^' + this.l_name();
                    urls += prefix + '/$\', ' + indexUrl;
                    urls += prefix + '/create/$\',' + createUrl;
                    urls += prefix + '/update/(?P<' + this.identifier() + '>\\S+)/$\',' + updateUrl;
                    urls += prefix + '/view/(?P<' + this.identifier() + '>\\S+)/$\',' + viewUrl;
                    urls += prefix + '/delete/(?P<' + this.identifier() + '>\\S+)/$\',' + deleteUrl;
                }

                urls += ')\n';
                urls += renderer.new_lines(1);

                return urls;
            };

            this.render_view_funcs = function (app_name, model, renderer) {
                var templatePrefix = app_name + "/" + model.l_name() + '_';
                var view_classes = renderer.new_lines(2);
                var urlPrefix = app_name + '.' + model.l_name() + '.';
                // index
                view_classes += '@login_required\n';
                view_classes += 'def ' + model.l_name() + '_index(request):\n';
                view_classes += renderer.spaces(4) + 'form = ' + model.name + 'SearchForm(request.GET)\n';
                view_classes += renderer.spaces(4) + 'models = form.search()\n';
                view_classes += renderer.spaces(4) + 'context = {\n';
                view_classes += renderer.spaces(8) + "'models': models,\n";
                view_classes += renderer.spaces(8) + "'form': form\n";
                view_classes += renderer.spaces(4) + '}\n';
                view_classes += renderer.spaces(4) + "return render(request, '" + templatePrefix + "index.html', context)";
                view_classes += renderer.new_lines(2);

                // view
                view_classes += '@login_required\n';
                view_classes += 'def ' + model.l_name() + '_view(request, id):\n';
                view_classes += renderer.spaces(4) + 'model = get_object_or_404(' + model.name + ', pk=id)\n';
                view_classes += renderer.spaces(4) + "return render(request, '" + templatePrefix + "view.html', {'model': model})\n";
                view_classes += renderer.new_lines(2);

                //delete 
                view_classes += '@login_required\n';
                view_classes += 'def ' + model.l_name() + '_delete(request, id):\n';
                view_classes += renderer.spaces(4) + 'model = get_object_or_404(' + model.name + ', pk=id)\n';
                view_classes += renderer.spaces(4) + 'model.delete()\n';
                view_classes += renderer.spaces(4) + "messages.success(request, 'Xóa thành công!')\n";
                view_classes += renderer.spaces(4) + "return redirect('" + urlPrefix + "index')";
                view_classes += renderer.new_lines(2);

                //create
                view_classes += '@login_required\n';
                view_classes += 'def ' + model.l_name() + '_create(request):\n';
                view_classes += renderer.spaces(4) + 'form = ' + model.name + 'Form(request.POST or None)\n';
                view_classes += renderer.spaces(4) + 'if form.is_valid():\n';
                view_classes += renderer.spaces(8) + model.name + '.created_by = request.user\n';
                view_classes += renderer.spaces(8) + "messages.success(request, 'Thêm mới thành công!')\n";
                view_classes += renderer.spaces(8) + "if 'save-and-continue' in request.POST:\n";
                view_classes += renderer.spaces(12) + "return redirect('" + urlPrefix + "create')\n";
                view_classes += renderer.spaces(8) + 'else:\n';
                view_classes += renderer.spaces(12) + "return redirect('" + urlPrefix + "view', model.id)\n";
                view_classes += renderer.new_lines(1);
                view_classes += renderer.spaces(4) + 'context = {\n';
                view_classes += renderer.spaces(8) + "'form': form,\n";
                view_classes += renderer.spaces(8) + "'post': request.POST\n";
                view_classes += renderer.spaces(4) + '}\n';
                view_classes += renderer.spaces(4) + "return render(request, '" + templatePrefix + "create.html', context)\n";
                view_classes += renderer.new_lines(2);

                //update
                view_classes += '@login_required\n';
                view_classes += 'def ' + model.l_name() + '_update(request, id):\n';
                view_classes += renderer.spaces(4) + 'model = get_object_or_404(' + model.name + ', pk=id)\n';
                view_classes += renderer.spaces(4) + 'form = ' + model.name + 'Form(request.POST or None, instance=model)\n';
                view_classes += renderer.spaces(4) + 'if form.is_valid():\n';
                view_classes += renderer.spaces(8) + model.name + '.updated_by = request.user\n';
                view_classes += renderer.spaces(8) + 'form.save()\n';
                view_classes += renderer.spaces(8) + "messages.success(request, 'Cập nhật thành công!')\n";
                view_classes += renderer.spaces(8) + "return redirect('" + urlPrefix + "view', model.id)\n";
                view_classes += renderer.new_lines(1);
                view_classes += renderer.spaces(4) + 'context = {\n';
                view_classes += renderer.spaces(8) + "'form': form\n";
                view_classes += renderer.spaces(4) + '}\n';
                view_classes += renderer.spaces(4) + "return render(request, '" + templatePrefix + "update.html', context)\n";

                return view_classes;
            };
            this.render_model_class_header = function (app_name, renderer) {
                var cls = 'class ' + this.name + '(models.Model):';
                return cls + renderer.new_lines(2);
            };
            this.render_model_class_fields = function (app_name, renderer) {
                var cls = '';
                if (this.fields.length > 0) {
                    cls += renderer.spaces(4) + "# Fields";
                    cls += renderer.new_lines(1);
                }
                jQuery.each(this.fields, function (i, field) {
                    if (renderer.pre_imported_modules_names().indexOf(field.module()) == -1) {
                        cls += renderer.spaces(4) + field.name + ' = ' + field.class_name() + '(' + field.opts + ')';
                    } else {
                        var _as = renderer.pre_imported_modules()[field.module()]['as'];
                        cls += renderer.spaces(4) + field.name + ' = ' + _as + '.' + field.class_name() + '(' + field.opts + ')';
                    }
                    cls += renderer.new_lines(1);
                });
                cls += renderer.new_lines(1);
                return cls;
            };
            this.render_model_class_relationships = function (app_name, renderer) {
                var cls = '';
                if (this.relationships.length > 0) {
                    cls += renderer.spaces(4) + "# Relationship Fields";
                    cls += renderer.new_lines(1);
                }

                // Create a related name mapping if we have multiple relationships
                // to the same model
                const relatedList = []
                const relatedNames = {}
                const relatedIndexs = {}
                this.relationships.forEach(function (relationship) {
                    const toClass = relationship.to_class()
                    relatedIndexs[toClass] = (relatedIndexs[toClass] || 0) + 1
                    if (relatedList.indexOf(toClass) === -1) {
                        relatedNames[relationship.name] = toClass.toLowerCase() + "s"
                    } else {
                        relatedNames[relationship.name] = toClass.toLowerCase() + "s_" + relatedIndexs[toClass]
                    }
                    relatedList.push(toClass)
                })

                jQuery.each(this.relationships, function (i, relationship) {
                    var module = '\'' + app_name + '.' + relationship.to_clean() + '\'';
                    if (relationship.external_app) {
                        module = '\'' + relationship.to_clean() + '\'';
                    }

                    // If the to field of the module is a built in class then use that as the relationship
                    if (relationship.to == $scope.user_model) {
                        module = $scope.user_model_setting;
                    } else if (renderer.built_in_models[relationship.to]) {
                        module = relationship.to_class();
                    }
                    if (renderer.pre_imported_modules_names().indexOf(relationship.module()) == -1) {
                        cls += renderer.spaces(4) + relationship.name + ' = ' + relationship.class_name() + '(';
                    } else {
                        var _as = renderer.pre_imported_modules()[relationship.module()]['as'];
                        cls += renderer.spaces(4) + relationship.name + ' = ' + _as + '.' + relationship.class_name() + '('
                    }
                    cls += renderer.new_lines(1) + renderer.spaces(8);

                    cls += module
                    cls += ',';
                    if (relationship.type != "django.db.models.ManyToManyField") {
                        cls += renderer.new_lines(1) + renderer.spaces(8);
                        cls += 'on_delete=models.CASCADE, ';
                    } else {
                        cls += renderer.new_lines(1) + renderer.spaces(8);
                    }

                    const related_name = relatedNames[relationship.name]

                    cls += 'related_name="' + related_name + '"';
                    if (relationship.opts) {
                        cls += ', ' + relationship.opts;
                    }
                    cls += renderer.new_lines(1) + renderer.spaces(4);
                    cls += ')';
                    cls += renderer.new_lines(1);
                });
                return cls;
            };

            this.render_model_class = function (app_name, renderer) {
                var cls = this.render_model_class_header(app_name, renderer);
                cls += this.render_model_class_fields(app_name, renderer);
                cls += this.render_model_class_relationships(app_name, renderer);
                cls += renderer.new_lines(1);
                cls += renderer.spaces(4) + 'class Meta:';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8) + 'ordering = (\'-' + this.ordering_field() + '\',)';

                cls += renderer.new_lines(2);
                cls += renderer.spaces(4) + 'def __unicode__(self):';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8) + 'return u\'%s\' % self.' + this.identifier();

                cls += renderer.new_lines(2);
                cls += renderer.spaces(4) + 'def get_absolute_url(self):';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8) + 'return reverse(\'' + app_name + '_' + this.l_name() + '_detail\', args=(self.' + this.identifier() + ',))';
                cls += renderer.new_lines(1);

                cls += renderer.new_lines(2);
                cls += renderer.spaces(4) + 'def get_update_url(self):';
                cls += renderer.new_lines(1);
                cls += renderer.spaces(8) + 'return reverse(\'' + app_name + '_' + this.l_name() + '_update\', args=(self.' + this.identifier() + ',))';
                cls += renderer.new_lines(3);

                return cls;
            };
            this.render_model_class_fields_only = function (app_name, renderer) {
                var cls = '';
                cls += this.render_model_class_header(app_name, renderer);
                cls += this.render_model_class_fields(app_name, renderer);
                return cls;
            };

            this._template_header = function () {
                return '{% extends "base.html" %}\n{% load static %}\n';
            };
            this._template_links = function (app_name) {
                var list_url = app_name + '_' + this.l_name() + '_list';
                return '<p><a class="btn btn-default" href="{% url \'' + list_url + '\' %}">' + this.name + ' Listing<\/a><\/p>\n';
            };
            this._wrap_block = function (block, content) {
                return '{% block ' + block + ' %}\n' + content + '\n{% endblock %}'
            };
            this.spaces = function (n) {
                var _n = n || 1;
                return new Array(_n + 1).join(" ");
            };
            this.render_form_html = function (app_name) {
                var formColumn1 = '';
                var formColumn2 = '';
                var _this = this;
                jQuery.each(this.fields, function (i, field) {
                    var line = _this.spaces(16) + '{{ form.' + field.name + '|as_crispy_field }}\n';
                    if (i % 2 == 0) {
                        formColumn1 += line;
                    } else {
                        formColumn2 += line;
                    }
                });

                return _this.replace_in_template(
                    _this.form,
                    [
                        ['__FORM_COLUMN_1__', formColumn1],
                        ['__FORM_COLUMN_2__', formColumn2],
                    ]
                )
            };
            this.render_index_html = function (app_name) {
                var urlPrefix = app_name + '.' + this.l_name();
                var searchColumn1 = '';
                var searchColumn2 = '';
                var indexHeader = '';
                var indexBody = '';

                jQuery.each(this.fields, function (i, field) {
                    indexHeader += _this.spaces(12) + '<th>' + field.verboseName + '</th>\n';
                    indexBody += _this.spaces(16) + '<td>{{model.' + field.name + '}}</td>\n';

                    var line = _this.spaces(16) + '{{ form.' + field.name + '|as_crispy_field }}\n';
                    if (i % 2 == 0) {
                        searchColumn1 += line;
                    } else {
                        searchColumn2 += line;
                    }
                });

                return _this.replace_in_template(
                    _this.index,
                    [
                        ['__MODEL_NAME__', this.displayName],
                        ['__INDEX_HEADER__', indexHeader],
                        ['__INDEX_BODY__', indexBody],
                        ['__SEARCH_COLUMN_1__', searchColumn1],
                        ['__SEARCH_COLUMN_2__', searchColumn2],
                        ['__URL_PREFIX__', urlPrefix]
                    ]
                )
            };
            this.render_view_field = function (field) {
                var row = _this.spaces(16) + '<th>' + field.verboseName + '</th>\n';
                row += _this.spaces(16) + '<td>{{model.' + field.name + '}}</td>\n';
                return row;
            };
            this.render_view_html = function (app_name) {
                var urlPrefix = app_name + '.' + this.l_name();
                var viewBody = '';

                for (var i = 0; i < this.fields.length; i += 2) {
                    viewBody += _this.spaces(12) + '<tr>\n';
                    viewBody += this.render_view_field(this.fields[i]);

                    if (i + 1 < this.fields.length) {
                        viewBody += this.render_view_field(this.fields[i + 1]);
                    }

                    viewBody += _this.spaces(12) + '</tr>\n';
                }

                jQuery.each(this.relationships, function (i, relationship) {
                    viewBody += _this.spaces(12) + '<tr>\n';
                    viewBody += _this.spaces(16) + '<th>' + relationship.verboseName + '</th>\n';
                    viewBody += _this.spaces(16) + '<td colspan="3">\n';
                    viewBody += _this.spaces(20) + '<ol class="pl-2">\n';
                    viewBody += _this.spaces(24) + '{% for item in model.' + relationship.name + '.all %}\n';
                    viewBody += _this.spaces(24) + '<li>{{item}}</li>\n';
                    viewBody += _this.spaces(24) + '{% endfor %}\n';
                    viewBody += _this.spaces(12) + '</tr>\n';
                });

                return _this.replace_in_template(
                    _this.view,
                    [
                        ['__MODEL_NAME__', this.displayName],
                        ['__VIEW_BODY__', viewBody],
                        ['__URL_PREFIX__', urlPrefix]
                    ]
                )
            };
            this.render_create_html = function (app_name) {
                var urlPrefix = app_name + '.' + this.l_name();

                return _this.replace_in_template(
                    _this.create,
                    [
                        ['__MODEL_NAME__', this.displayName],
                        ['__APP_NAME__', app_name],
                        ['__URL_PREFIX__', urlPrefix]
                    ]
                )
            };
            this.render_update_html = function (app_name) {
                var urlPrefix = app_name + '.' + this.l_name();

                return _this.replace_in_template(
                    _this.update,
                    [
                        ['__MODEL_NAME__', this.displayName],
                        ['__APP_NAME__', app_name],
                        ['__URL_PREFIX__', urlPrefix]
                    ]
                )
            };

            this.render_base_html = function () {
                return _this.base;
            }

            this.form_fields = function () {
                var readable_field_names = (this.readable_fields()).map(function (field) {
                    return field.name
                });
                var relationships = (this.relationships).map(function (relationship) {
                    return relationship.name;
                });
                var all_fields = readable_field_names.concat(relationships);
                if (all_fields.length) {
                    return '[\'' + all_fields.join('\', \'') + '\']';
                } else {
                    return '\'__all__\'';
                }
            };
            this.readable_fields = function () {
                var readable_fields = [];
                jQuery.each(this.fields, function (i, field) {
                    if (field.opts.indexOf('readonly') == -1
                        && field.opts.indexOf('editable') == -1
                        && field.opts.indexOf('auto_now_add') == -1
                        && field.type != 'django.contrib.contenttypes.fields.GenericForeignKey'
                        && field.type != 'django_extensions.db.fields.AutoSlugField') {
                        readable_fields.push(field);
                    }
                });
                return readable_fields;
            };

        }
        return new Model(options, http);
    };
}
function ModelParserFactory() {
    return function ($scope, $http) {
        function Parser() {
            this.parse = function (file, callback) {

                var reader = new FileReader();

                reader.onload = function (e) {
                    var text = reader.result;
                    var lines = text.split('\n');
                    var model_definitions = [];
                    var current_model = null;
                    var multi_line = '';
                    var model_regex = new RegExp("class\ ([a-zA-Z_0-9]*)[\(]([a-zA-Z._]*)[\)][\:]$");
                    var field_regex = new RegExp("^([a-zA-Z0-9_]+)\ \=\ ([a-zA-Z0-9._]+)[\(](.*)[\)]$");

                    jQuery.each(lines, function (i, line) {
                        line = line.trim();
                        var model_match = model_regex.exec(line);
                        if (model_match && model_match[2].match(/model/i)) {
                            var indexOfName = lines[i + 1].indexOf('# ');
                            var displayName = '';
                            if (indexOfName > -1) {
                                displayName = lines[i + 1].slice(indexOfName + 2);
                            }
                            current_model = {
                                'name': model_match[1],
                                'displayName': displayName,
                                'class': model_match[2],
                                'fields': [],
                                'relationships': []
                            };

                            model_definitions.push(current_model);
                            multi_line = '';
                        }
                        var matched_content;
                        var field_match = field_regex.exec(line);
                        if (field_match) {
                            matched_content = field_match;
                        }
                        var multi_line_match = field_regex.exec(multi_line);
                        if (multi_line_match) {
                            matched_content = multi_line_match;
                        }
                        if (matched_content) {
                            if (current_model && matched_content[2] && (matched_content[2].match(/field/i) || $scope.relationship_factory.relationship_match(matched_content[2]))) {
                                var is_relationship_field = $scope.relationship_factory.relationship_match(matched_content[2]);
                                if (is_relationship_field) {
                                    var rel_name = matched_content[1];
                                    var rel_type = matched_content[2];
                                    var raw_opts = matched_content[3].split(',');
                                    var rel_to = raw_opts.shift();
                                    var rel_opts = raw_opts.join(",").trim();
                                    //console.log('Model:', current_model.name, 'Relationship:', rel_name, rel_type, rel_to, rel_opts );
                                    current_model.relationships.push($scope.relationship_factory.make_relationship({
                                        'name': rel_name, 'type': rel_type, 'opts': rel_opts, 'to': rel_to
                                    }));
                                } else {
                                    var f_name = matched_content[1];
                                    var f_type = matched_content[2];
                                    var f_opts = matched_content[3];
                                    //console.log('Model:', current_model.name, 'Field:', f_name, f_type, f_opts);
                                    current_model.fields.push($scope.field_factory.make_field({
                                        'name': f_name, 'type': f_type, 'opts': f_opts
                                    }));
                                }
                            }
                            multi_line = '';
                        } else {
                            /*
                            There is no match for this line
                            Append to multi_line to try and match
                            if we are parsing a model
                            */
                            if (current_model) {
                                multi_line = multi_line + line;
                            }
                        }

                    });
                    var new_models = [];
                    jQuery.each(model_definitions, function (i, model_definition) {
                        var model = $scope.model_factory(model_definition, $scope, $http);
                        new_models.push(model);
                    });

                    if (callback) {
                        callback(new_models);
                    }

                };
                reader.readAsText(file);
            }
        }
        return new Parser();
    }
}
function ProjectFactory() {
    return function (http) {

        var _this = this;
        _this.http = http;
        _this.project_base_html = '';

        // _this.http.get('app/partials/py/settings.py').then(function (e) { _this.settings_py = e.data });
        // _this.http.get('app/partials/py/manage.py').then(function (e) { _this.manage_py = e.data });
        // _this.http.get('app/partials/py/urls.py').then(function (e) { _this.urls_py = e.data });
        // _this.http.get('app/partials/py/wsgi.py').then(function (e) { _this.wsgi_py = e.data });
        // _this.http.get('app/partials/py/channels.py').then(function (e) { _this.channels_py = e.data });
        _this.http.get('app/partials/views/project_base.html').then(function (e) { _this.project_base_html = e.data });

        _this.load = function (py, project_name) {
            return _this.http.get(py).then(function (e) {
                return _this.replace_in_template(
                    e.data, [['___PROJECT_NAME___', project_name]]
                );
            })
        }

        _this.replace_in_template = function (template, replacements) {
            jQuery.each(replacements, function (i, repl) {
                template = template.replace(new RegExp(repl[0], 'g'), repl[1]);
            });
            return template;
        };
        _this.render_project_requirements = function (include_channels, django2) {
            var requirements = "";
            if (django2) {
                requirements += "Django>=2\n";
                requirements += "django-extensions>=2\n";
                requirements += "djangorestframework==3.7.7\n";
                requirements += "django-crispy-forms==1.7.0\n";
            } else {
                requirements += "Django>=1.11,<2\n";
                requirements += "django-extensions==1.7.5\n";
                requirements += "djangorestframework==3.5.3\n";
                requirements += "django-crispy-forms==1.6.1\n";
            }
            requirements += "psycopg2-binary==2.7.5\n";
            if (include_channels) {
                requirements += "channels==1.1.8\n";
            }
            return requirements;
        };
        _this.render_project_manage_py = function (project_name) {
            return _this.replace_in_template(
                _this.manage_py,
                [
                    ['___PROJECT_NAME___', project_name]
                ]
            );
        };
        _this.render_project_settings_py = function (project_name, app_name, include_channels) {
            var rendered_settings_py = _this.replace_in_template(
                _this.settings_py,
                [
                    ['___PROJECT_NAME___', project_name],
                    ['___APP_NAME___', app_name]
                ]
            );
            if (include_channels) {
                var rendered_channels_py = _this.replace_in_template(
                    _this.channels_py,
                    [
                        ['___PROJECT_NAME___', project_name],
                    ]
                );
                rendered_settings_py += '\n' + rendered_channels_py;
            }
            return rendered_settings_py
        };
        _this.render_project_wsgi_py = function (project_name) {
            return _this.replace_in_template(
                _this.wsgi_py,
                [
                    ['___PROJECT_NAME___', project_name]
                ]
            );
        };
        _this.render_project_urls_py = function (app_name) {
            return _this.replace_in_template(
                _this.urls_py,
                [
                    ['___APP_NAME___', app_name]
                ]
            );
        };

        _this.render_project_base_html = function () {
            return _this.project_base_html;
        }
    }
}
angular.module('builder.services', [])
    .factory('ProjectFactory', [ProjectFactory])
    .factory('ModelFactory', [ModelServiceFactory])
    .factory('ModelParser', [ModelParserFactory])
    .factory('MessageService', [MessageServiceFactory])
    .factory('FieldFactory', [FieldFactory])
    .factory('RelationshipFactory', [RelationshipFactory])
    .factory('RenderFactory', [ModelRenderFactory])
    .factory('TarballFactory', [TarballFactory])
    .value('version', '0.1');
